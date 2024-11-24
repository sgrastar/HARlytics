<script>
  import {
    formatTimestamp,
    truncateText,
    httpStatusCSSClass,
    formatTime,
    formatBytes,
    formatGMTtoUTC,
    formatToLocalTime,
    formatPostDataValue,
    normalizePostData,
    exportToCSV,
  } from "$lib/utils";
  import { Button, Radio, Tooltip } from "flowbite-svelte";
  import { FileCsvOutline, QuestionCircleSolid } from "flowbite-svelte-icons";

  import EntryRow from "$lib/EntryRowGeneral.svelte";

  export let entries = [];
  export let pages = [];
  export let logFilename;
  export let isPathTruncated = true;
  export let isDomainTruncated = true;

  let viewMode = "entry";
  let showByPage = false;

  let windowWidth;

  // SvelteのonMount相当の処理
  import { onMount } from "svelte";

  onMount(() => {
    const updateWidth = () => {
      windowWidth = window.innerWidth;
    };

    window.addEventListener("resize", updateWidth);
    updateWidth();

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  });

  // より詳細な一意の識別子を生成する関数（EntryRowと同じ関数）
  const getEntryId = (entry) => {
    return [
      entry.pageref || "no-page", // ページ参照
      entry.url, // URL
      entry.timestamp, // タイムスタンプ
      entry.startedDateTime, // 開始時刻
    ].join("|");
  };

  let selectedEntryIds = new Set();
  let selectedTabs = new Map();
  let prevEntriesLength;

  $: {
    if (prevEntriesLength !== entries.length) {
      selectedEntryIds.clear();
      selectedTabs.clear();
      prevEntriesLength = entries.length;
      selectedEntryIds = selectedEntryIds;
      selectedTabs = selectedTabs;
    }
  }

  $: hasPagesInfo = pages && pages.length > 0;
  $: if (!hasPagesInfo && viewMode === "page") {
    viewMode = "entry";
  }

  function handleDetailExportCSV() {
    const csvHeaderData = entries.map((entry) => [
      typeof entry.pageref !== "undefined" ? entry.pageref : "",
      entry.path,
      entry.domain,
      entry.method,
      entry.status,
      entry.type,
      entry.responseMimeType,
      entry.timestamp,
      entry.time.toFixed(0),
      formatTime(entry.time),
      typeof entry.responseContentLength !== "undefined"
        ? entry.responseContentLength
        : "",
      typeof entry.responseContentLength !== "undefined"
        ? formatBytes(entry.responseContentLength)
        : "",
      entry.isCached ? entry.isCached : "",
      entry.age !== null ? entry.age : "",
      entry.age !== null ? formatTime(entry.age) : "",
      entry.timings.dns >= 0 ? entry.timings.dns.toFixed(2) : "",
      entry.timings.dns >= 0 ? formatTime(entry.timings.dns) : "",
      entry.timings.connect >= 0 ? entry.timings.connect.toFixed(2) : "",
      entry.timings.connect >= 0 ? formatTime(entry.timings.connect) : "",
      entry.timings.ssl >= 0 ? entry.timings.ssl.toFixed(2) : "",
      entry.timings.ssl >= 0 ? formatTime(entry.timings.ssl) : "",
      entry.timings.send.toFixed(2),
      formatTime(entry.timings.send),
      entry.timings.wait.toFixed(2),
      formatTime(entry.timings.wait),
      entry.timings.receive.toFixed(2),
      formatTime(entry.timings.receive),
    ]);

    exportToCSV(
      csvHeaderData,
      [
        "pageref",
        "Path",
        "Domain",
        "Method",
        "Status",
        "Type",
        "mimetype",
        "Timestamp",
        "Time",
        "Time-formatted",
        "Size",
        "Size-formatted",
        "IsCached",
        "Age",
        "Age-formatted",
        "DNS",
        "DNS-formatted",
        "Connect",
        "Connect-formatted",
        "SSL",
        "SSL-formatted",
        "Send",
        "Send-formatted",
        "Wait",
        "Wait-formatted",
        "Receive",
        "Receive-formatted",
      ],
      logFilename,
      "_detail",
    );
  }

  // IDベースのトグル関数
  function toggleEntryDetails(entry) {
    const entryId = getEntryId(entry);
    if (selectedEntryIds.has(entryId)) {
      selectedEntryIds.delete(entryId);
      selectedTabs.delete(entryId);
    } else {
      selectedEntryIds.add(entryId);
      selectedTabs.set(entryId, "Headers");
    }
    selectedEntryIds = selectedEntryIds;
    selectedTabs = selectedTabs;
  }

  function handleKeyDown(event, entry) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleEntryDetails(entry);
    }
  }

  function selectTab(entryId, tab) {
    selectedTabs.set(entryId, tab);
    selectedTabs = selectedTabs;
  }

  function isDisplayableValue(value) {
    console.log(value);
    return (
      value !== null &&
      value !== undefined &&
      typeof value !== "object" &&
      !ArrayBuffer.isView(value)
    );
  }

  function formatHeaderValue(value) {
    console.log(value);
    if (!isDisplayableValue(value)) {
      if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
        return "[Binary Data]";
      }
      if (typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch {
          return "[Complex Object]";
        }
      }
      return "[Unknown Data Type]";
    }
    return String(value);
  }

  // ヘッダーをイテラブルな配列に変換する関数
  function normalizeHeaders(headers) {
    if (!headers) return [];
    if (Array.isArray(headers)) {
      return headers.filter((header) => {
        const headerName = header.name.toLowerCase();
        return headerName !== "cookie" && headerName !== "set-cookie";
      });
    }
    if (typeof headers === "object") {
      return Object.entries(headers)
        .filter(([name]) => {
          const headerName = name.toLowerCase();
          return headerName !== "cookie" && headerName !== "set-cookie";
        })
        .map(([name, value]) => ({
          name,
          value: formatHeaderValue(value),
        }));
    }
    return [];
  }

  // バーの幅を計算する関数（最大100%を超えないように制限）
  function calculateBarWidth(timing, totalTime) {
    if (timing < 0) return 0;
    const percentage = (timing / totalTime) * 100;
    return Math.min(percentage, 100);
  }

  // バーの開始位置を計算する関数（最大100%を超えないように制限）
  function calculateBarLeft(timings, phase, totalTime) {
    let left = 0;
    const phases = [
      "blocked",
      "dns",
      "connect",
      "ssl",
      "send",
      "wait",
      "receive",
    ];
    const phaseIndex = phases.indexOf(phase);

    for (let i = 0; i < phaseIndex; i++) {
      if (timings[phases[i]] >= 0) {
        left += timings[phases[i]];
      }
    }

    return Math.min((left / totalTime) * 100, 100);
  }
</script>

<div class="p-2">
  <div class="grid grid-cols-12">
    <div class="col-span-3 flex gap-3" style="align-items: center;">
      <Radio
        bind:group={viewMode}
        value="entry"
        on:click={() => (showByPage = false)}>Entry View</Radio
      >
      {#if hasPagesInfo}
        <Radio
          bind:group={viewMode}
          value="page"
          on:click={() => (showByPage = true)}>Page View</Radio
        >

        <QuestionCircleSolid id="placement-4" size="sm" />
        <Tooltip triggeredBy="#placement-4" placement="right">
          Page View will not display entries without page information.
        </Tooltip>
      {:else}
        <Radio bind:group={viewMode} value="second" disabled>Page View</Radio>
      {/if}
    </div>
    <div class="col-span-9">
      {#if entries.length > 0}
        <div class="flex flex-row-reverse">
          <Button size="xs" on:click={handleDetailExportCSV}
            ><FileCsvOutline class="w-4 h-4 me-2" />Export Data to CSV</Button
          >
        </div>
      {/if}
    </div>
  </div>
</div>

<div class="request-detail-table">
  {#if entries.length === 0}
    <p style="text-align: center; line-height: 3em;">
      No data to display.<br />Please load the file or check your filter
      settings.
    </p>
  {:else}
    <div class="table-body">
      {#if showByPage && hasPagesInfo}
        {#each pages as page}
          <div class="page-header">
            <div class="flex items-center px-2 py-1 bg-gray-100">
              <div class="flex-grow font-medium" title={page.title}>
                {truncateText(page.title, 100) || `Page ${page.id}`}
                <span
                  class="text-sm text-gray-600"
                  style="display: inline-block; float:right;"
                >
                  (Load: {page.pageTimings.onLoad !== null
                    ? formatTime(page.pageTimings.onLoad)
                    : "N/A"})
                </span>
              </div>
            </div>
          </div>

          <div class="table-header indent">
            <div class="path header-cell">Path</div>
            <div class="domain header-cell">Domain</div>
            <div class="method header-cell">Method</div>
            <div class="status header-cell">Status</div>
            <div class="type header-cell">Type</div>
            {#if window.innerWidth >= 980}
              <div class="mimetype header-cell">mimeType</div>
            {/if}
            <div class="sign">
              <table>
                <tr>
                  <td class="auth"
                    ><span title="Authorization Header">A</span></td
                  >
                  <td class="postData"><span title="Post Data">P</span></td>
                  <td class="queryParameter"
                    ><span title="Query Parameter">Q</span></td
                  >
                  <td class="cookies"><span title="Set-Cookie">C</span></td>
                </tr>
              </table>
            </div>
            {#if window.innerWidth >= 980}
              <div class="timestamp header-cell">Timestamp</div>
            {/if}
            <div class="time header-cell">Time</div>
            <div class="size header-cell">Size</div>
            {#if window.innerWidth >= 980}
              <div class="cached header-cell">isCached</div>
            {/if}
            <!-- <div class="age header-cell">age</div> -->
            <div class="waterfall header-cell">Waterfall</div>
            <!-- <div class="dns header-cell">dns</div>
              <div class="connect header-cell">connect</div>
              <div class="ssl header-cell">ssl</div>
              <div class="send header-cell">send</div>
              <div class="wait header-cell">wait</div>
              <div class="receive header-cell">receive</div> -->
          </div>

          {#each entries.filter((entry) => entry.pageref === page.id) as entry}
            <EntryRow
              {entry}
              {entries}
              isIndented={false}
              hasPageInfo={true}
              selectedEntryIndexes={selectedEntryIds}
              {isPathTruncated}
              {isDomainTruncated}
              toggleEntryDetails={() => toggleEntryDetails(entry)}
              handleKeyDown={(e) => handleKeyDown(e, entry)}
              {selectedTabs}
              selectTab={(entryId, tab) => selectTab(getEntryId(entry), tab)}
              {normalizeHeaders}
              {normalizePostData}
              {httpStatusCSSClass}
              {formatTime}
              {formatBytes}
              {truncateText}
              {formatGMTtoUTC}
              {formatToLocalTime}
              {calculateBarWidth}
              {calculateBarLeft}
            />
          {/each}
        {/each}
      {:else}
        <div class="table-header">
          <div class="path header-cell">Path</div>
          <div class="domain header-cell">Domain</div>
          <div class="method header-cell">Method</div>
          <div class="status header-cell">Status</div>
          <div class="type header-cell">Type</div>
          {#if window.innerWidth >= 980}
            <div class="mimetype header-cell">mimeType</div>
          {/if}
          <div class="sign">
            <table>
              <tr>
                <td class="auth"><span title="Authorization Header">A</span></td
                >
                <td class="postData"><span title="Post Data">P</span></td>
                <td class="queryParameter"
                  ><span title="Query Parameter">Q</span></td
                >
                <td class="cookies"><span title="Set-Cookie">C</span></td>
              </tr>
            </table>
          </div>
          {#if window.innerWidth >= 980}
            <div class="timestamp header-cell">Timestamp</div>
          {/if}
          <div class="time header-cell">Time</div>
          <div class="size header-cell">Size</div>
          {#if window.innerWidth >= 980}
            <div class="cached header-cell">isCached</div>
          {/if}
          <!-- <div class="age header-cell">age</div> -->
          <div class="waterfall header-cell">Waterfall</div>
          <!-- <div class="dns header-cell">dns</div>
            <div class="connect header-cell">connect</div>
            <div class="ssl header-cell">ssl</div>
            <div class="send header-cell">send</div>
            <div class="wait header-cell">wait</div>
            <div class="receive header-cell">receive</div> -->
        </div>

        {#each entries as entry}
          <EntryRow
            {entry}
            {entries}
            isIndented={false}
            hasPageInfo={false}
            selectedEntryIndexes={selectedEntryIds}
            {isPathTruncated}
            {isDomainTruncated}
            toggleEntryDetails={() => toggleEntryDetails(entry)}
            handleKeyDown={(e) => handleKeyDown(e, entry)}
            {selectedTabs}
            selectTab={(entryId, tab) => selectTab(getEntryId(entry), tab)}
            {normalizeHeaders}
            {normalizePostData}
            {httpStatusCSSClass}
            {formatTime}
            {formatBytes}
            {truncateText}
            {formatGMTtoUTC}
            {formatToLocalTime}
            {calculateBarWidth}
            {calculateBarLeft}
          />
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .request-detail-table {
    width: 100%;
    /* overflow-x: auto; */
    font-size: 0.8rem;
  }

  .table-header {
    display: flex;
    position: sticky;
    top: 0;
    background: #f2f2f2;
    border-bottom: 1px solid #ccc;
    z-index: 1;
    padding: 0 0.5rem;
  }

  .table-header.indent {
    top: 29px;
  }

  .table-body {
    display: flex;
    flex-direction: column;
  }

  .header-cell {
    padding: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-cell {
    font-weight: bold;
  }

  .path {
    width: 20%;
    min-width: 150px;
  }
  .domain {
    width: 10%;
    min-width: 150px;
  }
  .type {
    width: 80px;
    text-align: center;
  }
  .mimetype {
    width: 150px;
  }
  .status {
    width: 60px;
    text-align: center;
  }
  .method {
    width: 70px;
    text-align: center;
  }
  .timestamp {
    width: 150px;
  }
  /* .cookies { width: 60px; text-align: right; } */
  .time {
    width: 70px;
    text-align: right;
  }
  .size {
    width: 70px;
    text-align: right;
  }
  .cached {
    width: 60px;
    text-align: center;
  }
  .sign table td {
    font-size: 100%;
    font-weight: bold;
    width: 1.2em;
  }
  .sign table td.auth,
  .sign table td.postData {
    color: red;
  }
  .sign table td.queryParameter,
  .sign table td.cookies {
    color: green;
  }

  @media (max-width: 979px) {
    .mimetype,
    .timestamp,
    .cached {
      display: none;
    }
  }

  :global(.cookies-table th.cookieName) {
    width: 14em;
  }
  :global(.cookies-table td.cookieValue) {
    word-break: break-all;
  }
  :global(.cookies-table th.cookiePath) {
    min-width: 8em;
  }
  :global(.cookies-table th.cookieDomain) {
    min-width: 14em;
  }
  :global(.cookies-table th.cookieExpires) {
    width: 20em;
  }
  :global(.cookies-table th.cookieHttpOnly, .cookies-table th.cookieSecure) {
    width: 5em;
  }
  
  .page-header {
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 2;
  }
  
  :global(.table-header.indent) {
    margin-left: 30px;
  }

</style>
