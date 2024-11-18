<script>
  import { onMount } from "svelte";
  import {
    formatTimestamp,
    truncateText,
    escapeForMermaid as escapeForSequence,
    httpStatusCSSClass,
    formatTime,
    formatBytes,
    exportToCSV,
    splitByLength,
    parseCacheControl,
    isResponseCached,
    getCommunicationType,
    getTopDomain,
    aggregateData,
    copyTextarea,
    formatGMTtoUTC,
    formatToLocalTime,
  } from "$lib/utils";

  import { getStatusCodeData, getMimeTypeData } from "$lib/chartUtils";
  import {
    statusRanges,
    communicationTypes,
    httpMethods,
  } from "$lib/constants";

  import EntryDetailTable from "$lib/EntryDetailTable.svelte";

  import {
    generateMermaidHeaderAndTitle,
    generateMermaidQueryString,
    generateMermaidPostData,
    generateMermaidRequestCookies,
    generateMermaidResponse,
    generateMermaidResponseCookies,
  } from "$lib/sequenceDiagramGenerator";
  import {
    generatePlantUMLHeaderAndTitle,
    generatePlantUMLQueryString,
    generatePlantUMLPostData,
    generatePlantUMLRequestCookies,
    generatePlantUMLResponse,
    generatePlantUMLResponseCookies,
  } from "$lib/sequenceDiagramGenerator";

  import { estimateConnectionSpeed } from "$lib/estimateConnectionSpeed.js";
  import SequenceExport from "$lib/components/SequenceExport.svelte";
  import PieChart from "$lib/components/PieChart.svelte";
  import {
    Fileupload,
    Input,
    Range,
    Label,
    Button,
    Toggle,
    Tabs,
    Badge,
    TabItem,
    MultiSelect,
    Dropdown,
    DropdownItem,
    DropdownDivider,
    Search,
    Textarea,
    Checkbox,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import {
    ChevronDownOutline,
    ChevronDoubleRightOutline,
    ChevronDoubleLeftOutline,
    FileCsvOutline,
    DrawSquareOutline,
    ChartPieSolid,
    WindowOutline,
    BarsFromLeftOutline,
    FilterSolid,
  } from "flowbite-svelte-icons";
  import mermaid from "mermaid";

  let logFilename = "";
  let logVersion = "";
  let logCreator = "";
  let hasPagesInfo = false;
  let hasInitiatorInfo = false;
  let hasCookieData = false;
  let hasPostData = false;
  let hasContentData = false;
  let hasHeaderAuthData = false;

  let pages = [];
  let entries = [];
  let urlFilter = "";
  let notUrlFilter = "";
  let allSelected = true;
  let filterTimer = null;
  let statusCounts = {};
  let typeCounts = {};
  let uniqueDomains = [];
  let domainCounts = {};
  let selectedDomains = [];
  let isUrlTruncated = true;
  let isPathTruncated = true;
  let isDomainTruncated = true;
  let isTimestampTruncated = true;

  let truncatedValues = {};

  ///chart
  let statusCodeData = [];
  let mimeTypeData = [];

  //diagrams
  let marmaidDivElem;
  let plantUMLCode = "";
  let mermaidCode = "";
  let truncateQueryStrings = true;
  let truncateQueryStringsLength = 25;
  let truncatePostData = true;
  let truncatePostDataLength = 25;
  let truncateReqCookie = true;
  let truncateReqCookieLength = 25;
  let truncateResCookie = true;
  let truncateResCookieLength = 25;
  let truncateHeaders = true;
  let truncateHeadersLength = 50;

  let addLifeline = true;
  let addRequestCookies = false;
  let addRequestQueryString = false;
  let addRequestPostData = false;
  let addResponseCookies = false;
  let addRequestHeaders = false;
  let addResponseHeaders = false;
  let addAuthHeaders = false;

  let addAutoNumber = false;
  let addTitle = true;
  let sequenceTitle = "";

  let selectedStatusRanges = [...statusRanges];
  let allStatusSelected = true;

  let selectedTypes = [...communicationTypes];

  //For Display Cookie
  let selectedValues = new Set();

  //mermaid.initialize({ startOnLoad: false });

  onMount(() => {
    // initialize

    console.log("the component has mounted");
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      sequence: {
        noteAlign: "left",
      },
      maxTextSize: 100000,
    });

    //console.log(marmaidDivElem);
  });

  function analyzeHAR(event) {
    const file = event.target.files[0];
    logFilename = file.name;
    // Initialize
    logVersion = "";
    logCreator = "";
    hasPagesInfo = false;
    hasInitiatorInfo = false;
    hasCookieData = false;
    hasPostData = false;
    hasContentData = false;
    hasHeaderAuthData = false;

    const reader = new FileReader();

    reader.onload = function (e) {
      const harContent = JSON.parse(e.target.result);
      pages = harContent.log.pages;
      entries = harContent.log.entries;
      logVersion = harContent.log.version;
      logCreator =
        harContent.log.creator.name +
        "(" +
        harContent.log.creator.version +
        ")";

      pages ? (hasPagesInfo = true) : (hasPagesInfo = false);
      harContent.log.entries[0]._initiator
        ? (hasInitiatorInfo = true)
        : (hasInitiatorInfo = false);

      entries = entries.map((entry) => {
        const pageref =
          hasPagesInfo && entry.pageref ? entry.pageref : "NoPageRef";
        const url = new URL(entry.request.url);
        const domain = url.hostname;
        const path = url.pathname;

        if (entry.request.postData) {
          hasPostData = true;
        }
        if (
          entry.response.headers.filter(
            (header) => header.name.toLowerCase() === "set-cookie",
          ).length
        ) {
          hasCookieData = true;
        }

        function hasHeader(headers, name) {
          return headers.some(
            (header) => header.name.toLowerCase() === name.toLowerCase(),
          );
        }

        const hasAuthHeader = hasHeader(entry.request.headers, "Authorization");
        const hasApiKey =
          hasHeader(entry.request.headers, "x-api-key") ||
          hasHeader(entry.request.headers, "api-key");
        const hasCustomAuth = hasHeader(entry.request.headers, "x-custom-auth");
        const hasSessionToken =
          hasHeader(entry.request.headers, "x-session-token") ||
          hasHeader(entry.request.headers, "session-token");
        const hasCSRFToken =
          hasHeader(entry.request.headers, "x-csrf-token") ||
          hasHeader(entry.request.headers, "x-xsrf-token");
        const hasAppKey = hasHeader(entry.request.headers, "x-application-key");
        const hasClientId = hasHeader(entry.request.headers, "x-client-id");
        const hasDeviceToken = hasHeader(
          entry.request.headers,
          "x-device-token",
        );
        const hasAccessToken = hasHeader(
          entry.request.headers,
          "x-access-token",
        );
        const hasRefreshToken = hasHeader(
          entry.request.headers,
          "x-refresh-token",
        );
        const hasTenantId = hasHeader(entry.request.headers, "x-tenant-id");
        const hasAuthToken = hasHeader(entry.request.headers, "x-auth-token");
        const hasTrackingId = hasHeader(entry.request.headers, "x-tracking-id");
        const hasUserId = hasHeader(entry.request.headers, "x-user-id");
        const hasSubscriptionKey = hasHeader(
          entry.request.headers,
          "ocp-apim-subscription-key",
        );
        const hasOrgId = hasHeader(entry.request.headers, "x-organization-id");
        const hasAccountId = hasHeader(entry.request.headers, "x-account-id");
        const hasOTP = hasHeader(entry.request.headers, "x-otp");
        const hasWorkspaceId = hasHeader(
          entry.request.headers,
          "x-workspace-id",
        );
        const hasSignature = hasHeader(entry.request.headers, "x-signature");
        const hasProjectId = hasHeader(entry.request.headers, "x-project-id");
        const hasPartnerId = hasHeader(entry.request.headers, "x-partner-id");
        const hasInstanceId = hasHeader(entry.request.headers, "x-instance-id");

        hasHeaderAuthData =
          hasAuthHeader ||
          hasApiKey ||
          hasCustomAuth ||
          hasSessionToken ||
          hasCSRFToken ||
          hasAppKey ||
          hasClientId ||
          hasDeviceToken ||
          hasAccessToken ||
          hasRefreshToken ||
          hasTenantId ||
          hasAuthToken ||
          hasTrackingId ||
          hasUserId ||
          hasSubscriptionKey ||
          hasOrgId ||
          hasAccountId ||
          hasOTP ||
          hasWorkspaceId ||
          hasProjectId ||
          hasSignature ||
          hasPartnerId ||
          hasInstanceId;

        const referer = entry.request.headers.find(
          (header) => header.name.toLowerCase() === "referer",
        )?.value;
        const requestPostData = parsePostData(entry.request.postData);
        const setCookieCount = entry.response.headers.filter(
          (header) => header.name.toLowerCase() === "set-cookie",
        ).length;
        const responseContentLength = entry.response.headers.find(
          (header) => header.name.toLowerCase() === "content-length",
        )?.value;
        const age = entry.response.headers.find(
          (header) => header.name.toLowerCase() === "age",
        )?.value;
        const ageInSeconds = age ? parseInt(age, 10) : null;
        const cacheControl =
          entry.response.headers.find(
            (header) => header.name.toLowerCase() === "cache-control",
          )?.value || "";
        const parsedCacheControl = parseCacheControl(cacheControl);
        const isCached = isResponseCached(ageInSeconds, parsedCacheControl);

        return {
          pages: pages,
          pageref: pageref,
          url: entry.request.url,
          method: entry.request.method,
          domain: domain,
          path: path,
          referer: referer,
          startedDateTime: entry.startedDateTime,
          time: entry.time,
          timings: entry.timings,
          initiator: entry._initiator,
          requestHeaderAll: entry.request.headers,
          requestPostData: requestPostData,
          requestBodySize: entry.request.bodySize,
          responseHeaderAll: entry.response.headers,
          responseHeaderSize: entry.response.headersSize,
          responseBodySize: entry.response.bodySize,
          responseTotalSize:
            entry.response.headersSize + entry.response.bodySize > 0
              ? entry.response.headersSize + entry.response.bodySize
              : 0,
          responseContentLength: responseContentLength,
          timestamp: formatTimestamp(new Date(entry.startedDateTime)),
          age: ageInSeconds,
          cacheControl: parsedCacheControl,
          isCached: isCached,
          status: entry.response.status,
          values: entry.request.cookies,
          requestQueryString: entry.request.queryString,
          requestCookies: entry.request.cookies, // リクエストのCookieを追加
          responseCookies: entry.response.cookies, // レスポンスのCookieを追加
          setCookieCount: setCookieCount,
          type: getCommunicationType(entry),
          responseMimeType: entry.response.content.mimeType
            ? entry.response.content.mimeType.split(";")[0]
            : "",
          //responseMimeType: getCommunicationType(entry)
          hasHeaderAuthData: hasHeaderAuthData,
        };
      });

      hasHeaderAuthData = entries.some((entry) => entry.hasHeaderAuthData);

      //selectedValues = new Set(entries.flatMap(entry => entry.values.map(value => value.name)));

      selectedValues = new Set([
        ...entries.flatMap((entry) =>
          entry.requestCookies.map((cookie) => cookie.name),
        ),
        ...entries.flatMap((entry) =>
          entry.responseCookies.map((cookie) => cookie.name),
        ),
      ]);

      statusCounts = entries.reduce((acc, entry) => {
        const statusRange = statusRanges.find(
          (range) =>
            (range.other &&
              (entry.status < 100 ||
                entry.status >= 600 ||
                isNaN(entry.status))) ||
            (entry.status >= range.min && entry.status <= range.max),
        );
        acc[statusRange.label] = (acc[statusRange.label] || 0) + 1;
        return acc;
      }, {});

      typeCounts = entries.reduce((acc, entry) => {
        acc[entry.type] = (acc[entry.type] || 0) + 1;
        return acc;
      }, {});

      uniqueDomains = [...new Set(entries.map((entry) => entry.domain))];

      domainCounts = entries.reduce((acc, entry) => {
        acc[entry.domain] = (acc[entry.domain] || 0) + 1;
        return acc;
      }, {});

      isUrlTruncated = true;
      truncatedValues = {};
      selectedValues.forEach((valueName) => {
        truncatedValues[valueName] = true;
      });

      sequenceTitle = "Sequence: " + logFilename;

      //const connectionSpeed = estimateConnectionSpeed(entries);
      //console.log(connectionSpeed);
    };

    reader.readAsText(file);
  }

  function parsePostData(postData) {
    if (!postData) {
      return null;
    }

    const mimeType = postData.mimeType
      ? postData.mimeType.split(";")[0].trim()
      : "";
    //console.log(mimeType);

    let requestPostData = null;
    if (mimeType === "application/x-www-form-urlencoded") {
      requestPostData = {
        mimeType: mimeType,
        text: decodeURIComponent(postData.text),
        params: postData.params.map((param) => ({
          name: decodeURIComponent(param.name),
          value: escapeForSequence(decodeURIComponent(param.value)),
        })),
      };
    } else if (mimeType === "text/plain") {
      requestPostData = {
        mimeType: mimeType,
        text: escapeForSequence(decodeURIComponent(postData.text)),
      };
    } else if (mimeType === "application/json") {
      try {
        const decodedText = decodeURIComponent(postData.text);
        const jsonData = JSON.parse(decodedText);
        requestPostData = {
          mimeType: mimeType,
          text: decodedText,
          params: Object.entries(jsonData).map(([name, value]) => ({
            name: decodeURIComponent(name),
            value: escapeForSequence(decodeURIComponent(value.toString())),
          })),
        };
      } catch (error) {
        requestPostData = {
          mimeType: mimeType,
          text: escapeForSequence(decodeURIComponent(postData.text)),
        };
      }
    } else {
      if (mimeType === "" || mimeType === null) {
        requestPostData = null;
      } else {
        requestPostData = {
          mimeType: mimeType,
          text: "Not supported data",
        };
      }
      // requestPostData = {
      //   mimeType: mimeType,
      //   text: escapeForSequence(decodeURIComponent(postData.text))
      // };
    }

    return requestPostData;
  }

  $: isMethodFiltered = !allMethodsSelected;
  $: isStatusFiltered = !allStatusSelected;
  $: isTypeFiltered = !allSelected;

  // ボタンのスタイルを動的に設定
  $: methodFilterStyle = isMethodFiltered
    ? "primary" // オレンジ背景、白文字
    : "light"; // 灰色背景、黒文字

  $: statusFilterStyle = isStatusFiltered ? "primary" : "light";

  $: typeFilterStyle = isTypeFiltered ? "primary" : "light";

  $: filteredEntries = entries.filter((entry) => {
    const domain_path = entry.domain + entry.path;
    const url = domain_path.toLowerCase();
    const urlFilters = urlFilter
      .split(",")
      .map((filter) => filter.trim().toLowerCase());

    const matchesUrlFilter = urlFilters.every((filter) => {
      if (filter.startsWith("-")) {
        return !url.includes(filter.slice(1));
      } else {
        return filter === "" || url.includes(filter);
      }
    });

    const matchesTypeFilter =
      selectedTypes.length === 0 ? false : selectedTypes.includes(entry.type);
    const matchesStatusFilter = selectedStatusRanges.some(
      (range) =>
        (range.other &&
          (entry.status < 100 || entry.status >= 600 || isNaN(entry.status))) ||
        (entry.status >= range.min && entry.status <= range.max),
    );
    const matchesDomainFilter =
      selectedDomains.length === 0 || selectedDomains.includes(entry.domain);
    const matchesMethodFilter =
      selectedMethods.length === 0
        ? false
        : selectedMethods.includes(entry.method);

    return (
      matchesUrlFilter &&
      matchesTypeFilter &&
      matchesStatusFilter &&
      matchesDomainFilter &&
      matchesMethodFilter
    );
  });

  //$: allValueNames = new Set(entries.flatMap(entry => entry.values.map(value => value.name)));
  //$: valueNames = new Set(filteredEntries.flatMap(entry => entry.values.map(value => value.name)));
  $: allValueNames = new Set([
    ...entries.flatMap((entry) =>
      entry.requestCookies.map((cookie) => cookie.name),
    ),
    ...entries.flatMap((entry) =>
      entry.responseCookies.map((cookie) => cookie.name),
    ),
  ]);
  $: valueNames = new Set([
    ...filteredEntries.flatMap((entry) =>
      entry.requestCookies.map((cookie) => cookie.name),
    ),
    ...filteredEntries.flatMap((entry) =>
      entry.responseCookies.map((cookie) => cookie.name),
    ),
  ]);

  $: domainOptions = uniqueDomains
    .sort((a, b) => {
      const topDomainA = getTopDomain(a);
      const topDomainB = getTopDomain(b);
      return topDomainA.localeCompare(topDomainB) || a.localeCompare(b);
    })
    .map((domain) => ({
      value: domain,
      name: `${domain} (${domainCounts[domain] || 0})`,
    }));

  $: {
    //console.log(filteredEntries);
    if (filteredEntries) {
      statusCodeData = getStatusCodeData(filteredEntries);
      mimeTypeData = getMimeTypeData(filteredEntries);
      //console.log(statusCodeData);
      //console.log(mimeTypeData);
    }
  }

  $: {
    //console.log(filteredEntries);
    if (filteredEntries) {
      mermaidCode = generateMermaidSequence();
      plantUMLCode = generatePlantUMLSequence();
    }
  }

  $: hasHeaderAuthData = entries.some((entry) => entry.hasHeaderAuthData);

  $: {
    if (
      addRequestCookies ||
      addResponseCookies ||
      addAutoNumber ||
      addTitle ||
      addLifeline ||
      sequenceTitle ||
      addRequestQueryString ||
      addRequestPostData ||
      truncateQueryStrings ||
      truncateQueryStringsLength ||
      truncatePostData ||
      truncatePostDataLength ||
      truncateReqCookie ||
      truncateReqCookieLength ||
      truncateResCookie ||
      truncateResCookieLength
    ) {
      //console.log("checkbox");
      if (filteredEntries && filteredEntries.length !== 0) {
        //console.log("checkbox and filter");
        plantUMLCode = generatePlantUMLSequence();
        mermaidCode = generateMermaidSequence();
        drawDiagram();
      }
    }
  }

  function toggleUrlTruncation() {
    isUrlTruncated = !isUrlTruncated;
  }

  function togglePathTruncation() {
    isPathTruncated = !isPathTruncated;
  }

  function toggleDomainTruncation() {
    isDomainTruncated = !isDomainTruncated;
  }

  function toggleTimestampTruncation() {
    isTimestampTruncated = !isTimestampTruncated;
  }

  function toggleValueTruncation(valueName) {
    truncatedValues[valueName] = !truncatedValues[valueName];
  }

  function handleCookieExportCSV() {
    const csvData = filteredEntries.map((entry) => [
      entry.path,
      entry.domain,
      entry.type,
      entry.status,
      entry.method,
      entry.timestamp,
      ...[...valueNames].flatMap((name) => {
        const requestCookie = entry.requestCookies.find(
          (cookie) => cookie.name === name,
        );
        const responseCookie = entry.responseCookies.find(
          (cookie) => cookie.name === name,
        );
        return [
          selectedValues.has(name) && requestCookie ? requestCookie.value : "",
          selectedValues.has(name) && responseCookie
            ? responseCookie.value
            : "",
        ];
      }),
    ]);

    exportToCSV(
      csvData,
      [
        "Path",
        "Domain",
        "Type",
        "Status",
        "Method",
        "Timestamp",
        ...[...valueNames].flatMap((name) => [`${name}(Req)`, `${name}(Res)`]),
      ],
      logFilename,
      "_cookies",
    );
  }

  // ドロップダウンの表示状態を管理
  let methodDropdownOpen = false;
  let statusDropdownOpen = false;
  let typeDropdownOpen = false;

  // ホバー状態とクリック状態を管理するタイマー
  let methodTimer;
  let statusTimer;
  let typeTimer;

  // マウスが離れてからドロップダウンを閉じるまでの遅延時間（ミリ秒）
  const CLOSE_DELAY = 200;

  function handleMouseEnter(type) {
    clearTimeout(methodTimer);
    clearTimeout(statusTimer);
    clearTimeout(typeTimer);

    switch (type) {
      case "method":
        methodDropdownOpen = true;
        break;
      case "status":
        statusDropdownOpen = true;
        break;
      case "type":
        typeDropdownOpen = true;
        break;
    }
  }

  function handleMouseLeave(type) {
    const timer = setTimeout(() => {
      switch (type) {
        case "method":
          methodDropdownOpen = false;
          break;
        case "status":
          statusDropdownOpen = false;
          break;
        case "type":
          typeDropdownOpen = false;
          break;
      }
    }, CLOSE_DELAY);

    switch (type) {
      case "method":
        methodTimer = timer;
        break;
      case "status":
        statusTimer = timer;
        break;
      case "type":
        typeTimer = timer;
        break;
    }
  }

  function handleStatusRangeClick(statusRange) {
    if (selectedStatusRanges.includes(statusRange)) {
      selectedStatusRanges = selectedStatusRanges.filter(
        (range) => range !== statusRange,
      );
    } else {
      selectedStatusRanges = [...selectedStatusRanges, statusRange];
    }
    allStatusSelected = selectedStatusRanges.length === statusRanges.length;
  }

  function handleAllStatusChange(event) {
    allStatusSelected = event.target.checked;
    if (allStatusSelected) {
      selectedStatusRanges = [...statusRanges];
    } else {
      selectedStatusRanges = [];
    }
  }

  // function handleTypeClick(type) {
  //   if (selectedTypes.includes(type)) {
  //     selectedTypes = selectedTypes.filter(t => t !== type);
  //   } else {
  //     selectedTypes = [...selectedTypes, type];
  //   }
  //   allSelected = selectedTypes.length === communicationTypes.length;
  // }
  function handleTypeClick(type) {
    if (selectedTypes.includes(type)) {
      selectedTypes = selectedTypes.filter((t) => t !== type);
    } else {
      selectedTypes = [...selectedTypes, type];
    }
    allSelected = selectedTypes.length === communicationTypes.length;
  }

  // function handleAllChange(event) {
  //     allSelected = event.target.checked;
  //   if (allSelected) {
  //     selectedTypes = [...communicationTypes];
  //   } else {
  //     selectedTypes = [];
  //   }
  // }
  function handleAllChange(event) {
    allSelected = event.target.checked;
    if (allSelected) {
      selectedTypes = [...communicationTypes];
    } else {
      selectedTypes = [];
    }
  }

  function handleSelectAllDomains() {
    selectedDomains = [...uniqueDomains];
  }

  function handleFilterInput() {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => {
      urlFilter = urlFilter.trim();
      notUrlFilter = notUrlFilter.trim();
    }, 1000);
  }

  let selectedMethods = [...httpMethods];
  let allMethodsSelected = true;
  let methodCounts = {};

  function handleMethodClick(method) {
    if (selectedMethods.includes(method)) {
      selectedMethods = selectedMethods.filter((m) => m !== method);
    } else {
      selectedMethods = [...selectedMethods, method];
    }
    allMethodsSelected = selectedMethods.length === httpMethods.length;
  }

  function handleAllMethodsChange(event) {
    allMethodsSelected = event.target.checked;
    selectedMethods = allMethodsSelected ? [...httpMethods] : [];
  }

  // エントリーの解析部分で methodCounts を計算
  $: methodCounts = entries.reduce((acc, entry) => {
    acc[entry.method] = (acc[entry.method] || 0) + 1;
    return acc;
  }, {});

  /**
   * @param {unknown} err
   */
  function displayErrorInGui(err) {
    //console.log(err);
  }

  mermaid.parseError = function (err, hash) {
    displayErrorInGui(err);
  };

  const textFieldUpdated = async function () {
    if (await mermaid.parse(mermaidCode)) {
      //console.log("parse");
      setTimeout(() => {
        drawDiagram();
      }, 300);
    }
  };

  const drawDiagram = async function () {
    //console.log("run drawDiagram");
    //console.log(marmaidDivElem);
    if (marmaidDivElem) {
      const { svg } = await mermaid.render("sequenceArea", mermaidCode);
      marmaidDivElem.innerHTML = svg;
    }
  };

  function generateMermaidSequence() {
    if (!filteredEntries || filteredEntries.length === 0) {
      return "";
    }

    let mermaidCode = generateMermaidHeaderAndTitle(
      addTitle,
      sequenceTitle,
      addAutoNumber,
    );

    filteredEntries.forEach((entry) => {
      const truncatedPath = truncateText(entry.path, 70);
      const requestArrow = `[${entry.method}] ${truncatedPath}`;
      const responseArrow = `${entry.status} - ${entry.responseMimeType}`;

      mermaidCode += `  Browser->>${entry.domain}: ${requestArrow}\n`;
      if (addLifeline) {
        mermaidCode += `  activate ${entry.domain}\n`;
      }

      mermaidCode += generateMermaidQueryString(
        entry,
        addRequestQueryString,
        truncateQueryStrings,
        truncateQueryStringsLength,
      );
      mermaidCode += generateMermaidPostData(
        entry,
        addRequestPostData,
        truncatePostData,
        truncatePostDataLength,
      );
      mermaidCode += generateMermaidRequestCookies(
        entry,
        addRequestCookies,
        truncateReqCookie,
        truncateReqCookieLength,
      );
      mermaidCode += generateMermaidResponse(entry, addLifeline);
      mermaidCode += generateMermaidResponseCookies(
        entry,
        addResponseCookies,
        truncateResCookie,
        truncateResCookieLength,
      );
    });

    return mermaidCode;
  }

  function generatePlantUMLSequence() {
    if (!filteredEntries || filteredEntries.length === 0) {
      return "";
    }

    let plantUMLCode = generatePlantUMLHeaderAndTitle(
      addTitle,
      sequenceTitle,
      addAutoNumber,
    );

    filteredEntries.forEach((entry) => {
      const truncatedPath = truncateText(entry.path, 70);
      const requestArrow = `[${entry.method}] ${truncatedPath}`;

      plantUMLCode += `Browser -> "${entry.domain}": ${requestArrow}\n`;
      if (addLifeline) {
        plantUMLCode += `activate "${entry.domain}"\n`;
      }

      plantUMLCode += generatePlantUMLQueryString(
        entry,
        addRequestQueryString,
        truncateQueryStrings,
        truncateQueryStringsLength,
      );
      plantUMLCode += generatePlantUMLPostData(
        entry,
        addRequestPostData,
        truncatePostData,
        truncatePostDataLength,
      );
      plantUMLCode += generatePlantUMLRequestCookies(
        entry,
        addRequestCookies,
        truncateReqCookie,
        truncateReqCookieLength,
      );
      plantUMLCode += generatePlantUMLResponse(entry, addLifeline);
      plantUMLCode += generatePlantUMLResponseCookies(
        entry,
        addResponseCookies,
        truncateResCookie,
        truncateResCookieLength,
      );
    });

    plantUMLCode += "@enduml";
    return plantUMLCode;
  }
</script>

<main class="p-4">
  <div id="action">
    <div class="grid grid-cols-12 mb-2 space-x-1">
      <div class="col-span-3 p-2 rounded">
        <div class="mb-2">
          <Label for="fileUpload">Select HAR file</Label>
          <Fileupload
            id="fileUpload"
            accept=".har"
            on:change={analyzeHAR}
            size="sm"
          />
        </div>
        <!-- TODO オンラインバージョンでサンプルharファイルの用意&読み込み機能         -->
        <div class="mb-2">
          <span>Log version : {logVersion} / {logCreator}</span>
        </div>
        <div class="mb-2">
          {#if hasPagesInfo == true}
            <Badge rounded color="indigo">Pages</Badge>
          {/if}
          {#if hasInitiatorInfo == true}
            <Badge rounded color="indigo">_initiator</Badge>
          {/if}
        </div>
        <div>
          {#if hasHeaderAuthData == true}
            <Badge rounded color="red">Header Auth</Badge>
          {/if}
          {#if hasCookieData == true}
            <Badge rounded color="red">Cookie</Badge>
          {/if}
          {#if hasPostData == true}
            <Badge rounded color="red">POST Data</Badge>
          {/if}
          {#if hasContentData == true}
            <Badge rounded color="red">Content</Badge>
          {/if}
        </div>
      </div>

      <div class="col-span-9 bg-gray-200 p-2 rounded">
        <div class="grid grid-cols-12 mb-2 flex items-center">
          <div class="col-span-10" id="domainFilterDiv">
            <Label for="domainFilter">Filter by Domain:</Label>
            <MultiSelect
              id="domainFilter"
              bind:value={selectedDomains}
              items={domainOptions}
              size="sm"
              placeholder="Load the file and select the domain(s) you want to analyze..."
            />
          </div>
          <div class="col-span-2 flex justify-center">
            <Button size="xs" color="light" on:click={handleSelectAllDomains}
              >Select All Domains</Button
            >
          </div>
        </div>

        <!-- BUG ボタンHover時の表示安定化  -->
        <div class="grid grid-cols-12 flex items-end">
          <div class="col-span-6">
            <Label for="urlFilter">URL Filters (any match):</Label>
            <Search
              type="text"
              id="urlFilter"
              bind:value={urlFilter}
              on:input={handleFilterInput}
              placeholder="comma-separated, use '-' to exclude"
              size="sm"
            />
          </div>

          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="relative inline-block col-span-2 ml-2"
            on:mouseenter={() => handleMouseEnter("method")}
            on:mouseleave={() => handleMouseLeave("method")}
          >
            <Button color={methodFilterStyle} size="sm" class="w-full">
              {#if isMethodFiltered}
                <FilterSolid class="w-3 h-3 mr-1" />
              {/if}
              Method Filter
              <ChevronDownOutline class="w-3 h-3 ml-2" />
            </Button>

            {#if methodDropdownOpen}
              <div class="absolute z-50 w-50">
                <div
                  class="bg-white rounded shadow dark:bg-gray-800 p-3 space-y-3 text-sm"
                >
                  <div class="px-4 py-2">
                    <div class="flex items-center">
                      <Toggle
                        class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                        size="small"
                        bind:checked={allMethodsSelected}
                        on:change={handleAllMethodsChange}
                      >
                        All
                      </Toggle>
                    </div>
                  </div>
                  <DropdownDivider />
                  {#each httpMethods as method}
                    <div
                      class="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <Checkbox
                        checked={selectedMethods.includes(method)}
                        on:click={() => handleMethodClick(method)}
                      >
                        {method} ({filteredEntries.filter(
                          (entry) => entry.method === method,
                        ).length}/{methodCounts[method] || 0})
                      </Checkbox>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="relative inline-block col-span-2 ml-2"
            on:mouseenter={() => handleMouseEnter("status")}
            on:mouseleave={() => handleMouseLeave("status")}
          >
            <Button color={statusFilterStyle} size="sm" class="w-full">
              {#if isStatusFiltered}
                <FilterSolid class="w-3 h-3 mr-1" />
              {/if}
              Status Filter
              <ChevronDownOutline class="w-3 h-3 ml-2" />
            </Button>

            {#if statusDropdownOpen}
              <div class="absolute z-50 w-50">
                <div
                  class="bg-white rounded shadow dark:bg-gray-800 p-3 space-y-3 text-sm"
                >
                  <div class="px-4 py-2">
                    <div class="flex items-center">
                      <Toggle
                        class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                        size="small"
                        bind:checked={allStatusSelected}
                        on:change={handleAllStatusChange}
                      >
                        All
                      </Toggle>
                    </div>
                  </div>
                  <DropdownDivider />
                  {#each statusRanges as statusRange}
                    <div
                      class="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <Checkbox
                        checked={selectedStatusRanges.includes(statusRange)}
                        on:click={() => handleStatusRangeClick(statusRange)}
                      >
                        {statusRange.label} ({filteredEntries.filter(
                          (entry) =>
                            (statusRange.other &&
                              (entry.status < 100 ||
                                entry.status >= 600 ||
                                isNaN(entry.status))) ||
                            (entry.status >= statusRange.min &&
                              entry.status <= statusRange.max),
                        ).length}/{statusCounts[statusRange.label] || 0})
                      </Checkbox>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="relative inline-block col-span-2 ml-2"
            on:mouseenter={() => handleMouseEnter("type")}
            on:mouseleave={() => handleMouseLeave("type")}
          >
            <Button color={typeFilterStyle} size="sm" class="w-full">
              {#if isTypeFiltered}
                <FilterSolid class="w-3 h-3 mr-1" />
              {/if}
              mimeType Filter
              <ChevronDownOutline class="w-3 h-3 ml-2" />
            </Button>

            {#if typeDropdownOpen}
              <div class="absolute z-50 w-50">
                <div
                  class="bg-white rounded shadow dark:bg-gray-800 p-3 space-y-3 text-sm"
                >
                  <div class="px-4 py-2">
                    <div class="flex items-center">
                      <Toggle
                        class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                        size="small"
                        bind:checked={allSelected}
                        on:change={handleAllChange}
                      >
                        All
                      </Toggle>
                    </div>
                  </div>
                  <DropdownDivider />
                  {#each communicationTypes as type}
                    <div
                      class="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <Checkbox
                        checked={selectedTypes.includes(type)}
                        on:click={() => handleTypeClick(type)}
                      >
                        {type} ({filteredEntries.filter(
                          (entry) => entry.type === type,
                        ).length}/{typeCounts[type] || 0})
                      </Checkbox>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          <!-- </div> -->
        </div>
      </div>
    </div>
  </div>

  <div id="display">
    <Tabs tabStyle="underline" class="mt-0">
      <TabItem open class="p-0">
        <div slot="title" class="flex items-center gap-2">
          <BarsFromLeftOutline size="sm" />Detail
        </div>
        <div id="analyzeDetailDisplay">
          <EntryDetailTable
            entries={filteredEntries}
            {pages}
            {logFilename}
            bind:isPathTruncated
            bind:isDomainTruncated
          />
        </div>
      </TabItem>

      <TabItem>
        <div slot="title" class="flex items-center gap-2">
          <DrawSquareOutline size="sm" />Sequence
        </div>
        <div id="analyzeSequenceDisplay" class="grid grid-cols-12">
          <div class="col-span-2 bg-gray-100 p-4 rounded">
            <h3 class="text-lg font-semibold mb-4">
              Sequence Diagram Settings
            </h3>
            <h4 class="text-base mb-2">General Settings</h4>
            <div class="mb-4">
              <Checkbox bind:checked={addAutoNumber}>Add Auto-number</Checkbox>
            </div>
            <div class="mb-4">
              <div>
                <Checkbox bind:checked={addTitle} class="mb-2"
                  >Add Title</Checkbox
                >
                <Input
                  type="text"
                  id="sequenceTitle"
                  bind:value={sequenceTitle}
                  size="sm"
                />
              </div>
            </div>
            <div class="mb-4">
              <Checkbox bind:checked={addLifeline} class="mb-2"
                >Add Lifeline Activation and Destruction</Checkbox
              >
            </div>

            <h4 class="text-base mb-2">Notes Settings</h4>

            <div class="mb-4">
              <Checkbox bind:checked={addRequestQueryString}
                >Show QueryString</Checkbox
              >
              {#if addRequestQueryString}
                <Checkbox bind:checked={truncateQueryStrings} class="ml-4 mt-2"
                  >Truncate QueryString</Checkbox
                >
                {#if truncateQueryStrings}
                  <div class="mt-1" style="margin-left: 3.1em;">
                    <Label
                      >Number of characters to show<span
                        >: {truncateQueryStringsLength}</span
                      ></Label
                    >
                    <Range
                      size="sm"
                      id="range-truncate-query-strings"
                      min="5"
                      max="100"
                      bind:value={truncateQueryStringsLength}
                      step="5"
                    />
                  </div>
                {/if}
              {/if}
            </div>
            <div class="mb-4">
              <Checkbox bind:checked={addRequestPostData}
                >Show postData</Checkbox
              >
              {#if addRequestPostData}
                <Checkbox bind:checked={truncatePostData} class="ml-4 mt-2"
                  >Truncate postData</Checkbox
                >
                {#if truncatePostData}
                  <div class="mt-1" style="margin-left: 3.1em;">
                    <Label
                      >Number of characters to show<span
                        >: {truncatePostDataLength}</span
                      ></Label
                    >
                    <Range
                      size="sm"
                      id="range-truncate-post-data"
                      min="5"
                      max="100"
                      bind:value={truncatePostDataLength}
                      step="5"
                    />
                  </div>
                {/if}
              {/if}
            </div>
            <div class="mb-4">
              <Checkbox bind:checked={addRequestCookies}
                >Show Request Cookies</Checkbox
              >
              {#if addRequestCookies}
                <Checkbox bind:checked={truncateReqCookie} class="ml-4 mt-2"
                  >Truncate Request Cookies</Checkbox
                >
                {#if truncateReqCookie}
                  <div class="mt-1" style="margin-left: 3.1em;">
                    <Label
                      >Number of characters to show<span
                        >: {truncateReqCookieLength}</span
                      ></Label
                    >
                    <Range
                      size="sm"
                      id="range-truncate-req-cookie"
                      min="5"
                      max="100"
                      bind:value={truncateReqCookieLength}
                      step="5"
                    />
                  </div>
                {/if}
              {/if}
            </div>
            <div class="mb-4">
              <Checkbox bind:checked={addResponseCookies}
                >Show Response Cookies</Checkbox
              >
              {#if addResponseCookies}
                <Checkbox bind:checked={truncateResCookie} class="ml-4 mt-2"
                  >Truncate Response Cookies</Checkbox
                >
                {#if truncateResCookie}
                  <div class="mt-1" style="margin-left: 3.1em;">
                    <Label
                      >Number of characters to show<span
                        >: {truncateResCookieLength}</span
                      ></Label
                    >
                    <Range
                      size="sm"
                      id="range-truncate-req-cookie"
                      min="5"
                      max="100"
                      bind:value={truncateResCookieLength}
                      step="5"
                    />
                  </div>
                {/if}
              {/if}
            </div>
          </div>
          <div class="col-span-8 p-4">
            <h3 class="text-lg font-semibold">Sequence Preview (Mermaid)</h3>
            <!--<textarea on:input={textFieldUpdated} bind:value={mermaidCode} rows="10" style="width: 50em;"></textarea>-->
            <div id="graph" bind:this={marmaidDivElem}></div>
          </div>
          <div class="col-span-2 bg-gray-100 p-4 rounded">
            <h3 class="text-lg font-semibold mb-4">Export...</h3>

            <div class="mb-2">
              <h4 class="text-base mb-2">PNG/SVG Format</h4>
              <SequenceExport {logFilename} />
            </div>

            <div class="mb-2">
              <div class="mb-2 flex justify-between">
                <h4 class="text-base">Mermaid Diagram</h4>
                <Button
                  size="xs"
                  class="px-2 py-0.5 font-light"
                  on:click={() => copyTextarea("mermaidCodeTextarea")}
                  >Copy</Button
                >
              </div>

              <Textarea
                rows="5"
                id="mermaidCodeTextarea"
                readonly
                bind:value={mermaidCode}
              ></Textarea>
            </div>

            <div class="mb-2">
              <div class="mb-2 flex justify-between">
                <h4 class="text-base">PlantUML Diagram</h4>
                <Button
                  size="xs"
                  class="px-2 py-0.5 font-light"
                  on:click={() => copyTextarea("plantUMLCodeTextarea")}
                  >Copy</Button
                >
              </div>

              <Textarea
                id="plantUMLCodeTextarea"
                rows="5"
                readonly
                bind:value={plantUMLCode}
                on:change={textFieldUpdated}
              ></Textarea>
            </div>
          </div>
        </div>
      </TabItem>
      <TabItem>
        <div slot="title" class="flex items-center gap-2">
          <WindowOutline size="sm" />Cookie
        </div>

        <div>
          {#if filteredEntries.length > 0}
            <div class="flex flex-row-reverse mb-2">
              <Button size="xs" on:click={handleCookieExportCSV}
                ><FileCsvOutline class="w-4 h-4 me-2" />Export Data to CSV</Button
              >
            </div>
          {/if}
          <div id="analyzeCookieDisplay">
            {#if selectedTypes.length === 0}
              <p>No data to display.</p>
            {:else if filteredEntries.length > 0}
              <table>
                <thead>
                  <tr>
                    <th class="path" rowspan="2">
                      Path
                      {#if filteredEntries.some((entry) => entry.path.length > 30)}
                        <button
                          type="button"
                          on:click={togglePathTruncation}
                          aria-label="Toggle path truncation"
                        >
                          {#if isPathTruncated}
                            <ChevronDoubleRightOutline />
                          {:else}
                            <ChevronDoubleLeftOutline />
                          {/if}
                        </button>
                      {/if}
                    </th>
                    <th class="domain" rowspan="2">
                      Domain
                      {#if filteredEntries.some((entry) => entry.domain.length > 30)}
                        <button
                          type="button"
                          on:click={toggleDomainTruncation}
                          aria-label="Toggle domain truncation"
                        >
                          {#if isDomainTruncated}
                            <ChevronDoubleRightOutline />
                          {:else}
                            <ChevronDoubleLeftOutline />
                          {/if}
                        </button>
                      {/if}
                    </th>
                    <th class="type" rowspan="2">Type</th>
                    <th class="status" rowspan="2">Status</th>
                    <th class="method" rowspan="2">Method</th>
                    <th class="timestamp" rowspan="2">
                      Timestamp
                      {#if filteredEntries.some((entry) => entry.timestamp.length > 10)}
                        <button
                          type="button"
                          on:click={toggleTimestampTruncation}
                          aria-label="Toggle timestamp truncation"
                        >
                          {#if isTimestampTruncated}
                            <ChevronDoubleRightOutline />
                          {:else}
                            <ChevronDoubleLeftOutline />
                          {/if}
                        </button>
                      {/if}
                    </th>
                    {#each [...allValueNames] as name}
                      {#if valueNames.has(name)}
                        <th colspan="2">
                          {#if name.length > 20 || filteredEntries.some((entry) => entry.requestCookies.find((cookie) => cookie.name === name && cookie.value.length > 20) || entry.responseCookies.find((cookie) => cookie.name === name && cookie.value.length > 20))}
                            <span title={name}
                              >{truncatedValues[name]
                                ? truncateText(name, 20)
                                : name}</span
                            >
                            <button
                              type="button"
                              on:click={() => toggleValueTruncation(name)}
                              aria-label="Toggle value truncation for {name}"
                            >
                              {#if truncatedValues[name]}
                                <ChevronDoubleRightOutline />
                              {:else}
                                <ChevronDoubleLeftOutline />
                              {/if}
                            </button>
                          {:else}
                            {name}
                          {/if}
                        </th>
                      {/if}
                    {/each}
                  </tr>
                  <tr>
                    <!--<th class="path"></th>
                  <th class="domain"></th>
                  <th class="type"></th>
                  <th class="status"></th>
                  <th class="method"></th>
                  <th class="timestamp"></th>-->
                    {#each [...allValueNames] as name}
                      {#if valueNames.has(name)}
                        <th>Request</th>
                        <th>Response</th>
                      {/if}
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each filteredEntries as entry}
                    <tr style="border-bottom:1px solid #ccc">
                      <th class="path">
                        {#if entry.path.length > 30}
                          <span title={entry.url}
                            >{isPathTruncated
                              ? truncateText(entry.path, 30)
                              : entry.path}</span
                          >
                        {:else}
                          {entry.path}
                        {/if}
                      </th>
                      <th class="domain">
                        {#if entry.domain.length > 30}
                          <span title={entry.domain}
                            >{isDomainTruncated
                              ? truncateText(entry.domain, 30)
                              : entry.domain}</span
                          >
                        {:else}
                          {entry.domain}
                        {/if}
                      </th>
                      <th class="type"><span>{entry.type}</span></th>
                      <th class="status {httpStatusCSSClass(entry.status)}"
                        >{entry.status}</th
                      >
                      <th class="method {entry.method}"
                        ><span>{entry.method}</span></th
                      >
                      <th class="timestamp">
                        {#if entry.timestamp.length > 10}
                          <span title={entry.timestamp}
                            >{isTimestampTruncated
                              ? truncateText(entry.timestamp, 10)
                              : entry.timestamp}</span
                          >
                        {:else}
                          {entry.timestamp}
                        {/if}
                      </th>
                      {#each [...allValueNames] as name}
                        {#if valueNames.has(name)}
                          {@const requestCookie = entry.requestCookies.find(
                            (cookie) => cookie.name === name,
                          )}
                          {@const responseCookie = entry.responseCookies.find(
                            (cookie) => cookie.name === name,
                          )}
                          {@const requestValue = requestCookie
                            ? requestCookie.value
                            : ""}
                          {@const responseValue = responseCookie
                            ? responseCookie.value
                            : ""}
                          <td>
                            {#if requestValue}
                              {#if requestValue.length > 20}
                                <span title={requestValue}>
                                  {truncatedValues[name]
                                    ? truncateText(requestValue, 20)
                                    : requestValue}
                                </span>
                              {:else}
                                {requestValue}
                              {/if}
                            {/if}
                          </td>
                          <td>
                            {#if responseValue}
                              {#if responseValue.length > 20}
                                <span title={responseValue}>
                                  {truncatedValues[name]
                                    ? truncateText(responseValue, 20)
                                    : responseValue}
                                </span>
                              {:else}
                                {responseValue}
                              {/if}
                            {/if}
                          </td>
                        {/if}
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            {:else}
              <p>No data to display.</p>
            {/if}
          </div>
        </div>
      </TabItem>
      <TabItem>
        <div slot="title" class="flex items-center gap-2">
          <ChartPieSolid size="sm" />Statistics
        </div>
        <div id="analyzeOverviewDisplay">
          {#if filteredEntries.length > 0}
            <div
              id="chart"
              style="display: flex; flex-direction: row; align-items: center;"
            >
              <div>
                <h2 class="text-lg font-semibold mb-4">
                  HTTP Status Code Distribution
                </h2>
                <div style="width: 100%; max-width: 400px; margin: 0 auto;">
                  <PieChart data={statusCodeData} width={400} height={230} />
                </div>
              </div>

              <div>
                <h2 class="text-lg font-semibold mb-4">
                  MIME Type Distribution
                </h2>
                <div style="width: 100%; max-width: 400px; margin: 0 auto;">
                  <PieChart data={mimeTypeData} width={400} height={230} />
                </div>
              </div>
            </div>
          {/if}

          <div id="buildTimestamp">Build ver.20241117230324</div>
        </div>
      </TabItem>
    </Tabs>
  </div>
</main>

<style>
  :global(body) {
    font-size: 100%;
  }
  main {
    font-size: 80%;
  }
  #action {
    height: 100%;
  }

  :global(#domainFilterDiv div[role="listbox"]) {
    background: #fff;
  }

  :global(#domainFilterDiv div[role="listbox"] span) {
    height: 4.2em;
    overflow: auto;
  }

  .relative.inline-block {
    margin-right: 0.5rem; /* フィルター間の間隔 */
  }

  /* ドロップダウンの位置調整が必要な場合 */
  .absolute {
    top: 100%;
    left: 0;
    margin-top: 0.25rem;
  }

  :global(div[role="tabpanel"]) {
    padding: 1em;
    margin-top: 0;
  }

  #analyzeCookieDisplay {
    height: 53vh;
    overflow: scroll;
  }
  /* #analyzeDetailDisplay table {
    border-collapse: collapse;
    border: none;
  } */
  #analyzeCookieDisplay table {
    border-collapse: collapse;
    width: 100%;
    border: none;
  }
  th,
  td {
    /*border: 1px solid black;*/
    padding: 3px 8px;
    text-align: left;
    white-space: nowrap;
  }

  thead {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  th:first-child {
    position: -webkit-sticky;
    position: sticky;
    left: 0;
  }

  thead th:first-child {
    z-index: 2;
  }
  thead th {
    background-color: #f2f2f2;
  }

  thead th.path {
    width: 8em;
    z-index: 10;
    background-color: #f2f2f2;
  }
  thead th.domain {
    width: 8em;
    background-color: #f2f2f2;
  }
  thead th.timestamp {
    width: 14em;
  }
  thead th.method {
    width: 8em;
  }

  thead th.timestamp {
    width: 14em;
  }
  thead th.method {
    width: 8em;
  }

  thead th.status {
    width: 4em;
  }
  thead th.type {
    width: 11em;
  }
  thead th > * {
    display: inline-block;
    vertical-align: middle;
  }

  thead th button {
    margin-left: 5px;
  }
  tbody th {
    font-weight: normal;
  }

  tbody th.path {
    background-color: #f9fafb;
  }
  tbody th.domain {
    background-color: #f9fafb;
  }
  tbody th.timestamp {
    background: #efefef;
    text-align: center;
    font-size: 100%;
    color: #333;
  }
  tbody th.method {
    background: #efefef;
    text-align: center;
    font-size: 100%;
    color: #333;
  }
  tbody th.type {
    background: #efefef;
    text-align: center;
    font-size: 100%;
    color: #333;
  }
  tbody th.status {
    text-align: center;
  }
  tbody th.status.info,
  tbody th.status.success {
    background: #99ffa2;
  }
  :global(tbody td.status.info) {
    background: #99ffa2;
  }
  :global(tbody td.status.success) {
    background: #99ffa2;
  }

  tbody th.status.redirect {
    background: #eaff99;
  }
  :global(tbody td.status.redirect) {
    background: #eaff99;
  }
  tbody th.status.cliError {
    background: rgb(255, 153, 161);
  }
  :global(td.status.cliError) {
    background: rgb(255, 153, 161);
  }
  tbody th.status.srvError {
    background: #ff4554;
    color: #fff;
  }
  :global(tbody th.status.srvError) {
    background: #ff4554;
    color: #fff;
  }
  /* tbody td.setCookies,
  tbody td.time,
  tbody td.size,
  tbody td.dns,
  tbody td.connect,
  tbody td.ssl,
  tbody td.send,
  tbody td.wait,
  tbody td.receive {
      text-align: right;
  } */

  .truncate-icon {
    cursor: pointer;
  }
</style>
