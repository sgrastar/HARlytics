<script>
  import {
    formatTimestamp,
    truncateText,
    httpStatusCSSClass,
    formatTime,
    getHttpStatusDescription,
    formatBytes,
    formatGMTtoUTC,
    formatToLocalTime,
    formatPostDataValue,
    normalizePostData,
    exportToCSV,
  } from "$lib/utils";
  import { Button, Radio, Tooltip } from "flowbite-svelte";
  import { FileCsvOutline, QuestionCircleSolid } from "flowbite-svelte-icons";

  import EntryRowCache from "$lib/components/EntryRowCache.svelte";

  export let entries = [];
  export let pages = [];
  export let logFilename;
  export let isPathTruncated = true;
  export let isDomainTruncated = true;
  export let displayMode= "cacheStatus";

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
  $: displayMode = displayMode;

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
    <div class="col-span-3 flex gap-4" style="align-items: center;">
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
    <div class="col-span-6 flex">
        <div class="flex items-center gap-4">
          <span class="text-gray-600 dark:text-gray-400">Display Mode:</span>
          <Radio bind:group={displayMode} value="cacheStatus" on:click={() => (displayMode = 'cacheStatus')}>Cache Status</Radio>
          <Radio bind:group={displayMode} value="CDNDeliveryStatus" on:click={() => (displayMode = 'CDNDeliveryStatus')}>CDN Delivery Status</Radio>
          <Radio bind:group={displayMode} value="resourceValidation" on:click={() => (displayMode = 'resourceValidation')}>Resource Validation</Radio>
        </div>
    </div>
    <div class="col-span-3">
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
    <p style="text-align: center; line-height: 3em;" class=" text-gray-900 dark:text-gray-300">
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
            <div class="time header-cell">Time</div>
            <div class="size header-cell">Size</div>
            <div class="cdnProvider header-cell">CDN</div>
            {#if displayMode == "cacheStatus" || displayMode == "CDNDeliveryStatus" || displayMode == "resourceValidation"}
            <div class="cdnDataSource header-cell">Source</div>
            {/if}
            <!-- {#if displayMode == "CDNDeliveryStatus"}
            <div class="cdnFromCDN header-cell">FromCDN</div>
            <div class="cdnFromOrigin header-cell">FromOrigin</div>
            <div class="cdnFromDiskCache header-cell">FromDisk</div>
            {/if} -->
            {#if displayMode == "CDNDeliveryStatus"}
            <div class="httpVersion header-cell">Protocol</div>
            <div class="cdnEdgelocation header-cell">Location</div>
            <div class="cdnCacheStatus header-cell">CDNCacheStatus</div>
            {/if}
            {#if displayMode == "cacheStatus"}
            <div class="cdnFreshness header-cell" title="Status of resource in CDN cache based on s-maxage or max-age directive.">CDNFresh</div>
            <!-- Shows the resource freshness status in CDN cache based on s-maxage directive or max-age. This influences content delivery from edge servers to the client. -->
            <div class="browserFreshness header-cell" title="Status of resource in browser cache based on max-age or Expires header.">BrowserFresh</div>
            <!-- Indicates if the resource is still fresh in browser cache or has become stale based on max-age directive or Expires header. This affects client-side caching behavior. -->
            {/if}
            <div class="cacheStorage header-cell">Storage</div>
            {#if displayMode != "resourceValidation"}
            <div class="cacheTTL header-cell">TTL</div>
            {/if}
            <div class="cachePolicy header-cell">Policy</div>
            {#if displayMode == "resourceValidation"}
            <div class="etag header-cell">ETag</div>
            <div class="lastModified header-cell">Last-Modified</div>
            {/if}
            {#if displayMode == "resourceValidation" || displayMode == "cacheStatus"}
            <div class="age header-cell">Age</div>
            {/if}
            {#if displayMode == "cacheStatus"}
            <div class="vary header-cell">Vary</div>
            {/if}
            {#if displayMode == "CDNDeliveryStatus"}
            <div class="contentEncoding header-cell" title="Content-Encoding">CE</div>
            {/if}
          </div>

          {#each entries.filter((entry) => entry.pageref === page.id) as entry}
            <EntryRowCache
              {entry}
              {displayMode}
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
              {getHttpStatusDescription}
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
            <div class="time header-cell">Time</div>
            <div class="size header-cell">Size</div>
            <div class="cdnProvider header-cell">CDN</div>
            {#if displayMode == "cacheStatus" || displayMode == "CDNDeliveryStatus" || displayMode == "resourceValidation"}
            <div class="cdnDataSource header-cell">Source</div>
            {/if}
            <!-- {#if displayMode == "CDNDeliveryStatus"}
            <div class="cdnFromCDN header-cell">FromCDN</div>
            <div class="cdnFromOrigin header-cell">FromOrigin</div>
            <div class="cdnFromDiskCache header-cell">FromDisk</div>
            {/if} -->
            {#if displayMode == "CDNDeliveryStatus"}
            <div class="httpVersion header-cell">Protocol</div>
            <div class="cdnEdgelocation header-cell">Location</div>
            <div class="cdnCacheStatus header-cell">CDNCacheStatus</div>
            {/if}
            {#if displayMode == "cacheStatus"}
            <div class="cdnFreshness header-cell" title="Status of resource in CDN cache based on s-maxage or max-age directive.">CDNFresh</div>
            <!-- Shows the resource freshness status in CDN cache based on s-maxage directive or max-age. This influences content delivery from edge servers to the client. -->
            <div class="browserFreshness header-cell" title="Status of resource in browser cache based on max-age or Expires header.">BrowserFresh</div>
            <!-- Indicates if the resource is still fresh in browser cache or has become stale based on max-age directive or Expires header. This affects client-side caching behavior. -->
            {/if}
            <div class="cacheStorage header-cell">Storage</div>
            {#if displayMode != "resourceValidation"}
            <div class="cacheTTL header-cell">TTL</div>
            {/if}
            <div class="cachePolicy header-cell">Policy</div>
            {#if displayMode == "resourceValidation"}
            <div class="etag header-cell">ETag</div>
            <div class="lastModified header-cell">Last-Modified</div>
            {/if}
            {#if displayMode == "resourceValidation" || displayMode == "cacheStatus"}
            <div class="age header-cell">Age</div>
            {/if}
            {#if displayMode == "cacheStatus"}
            <div class="vary header-cell">Vary</div>
            {/if}
            {#if displayMode == "CDNDeliveryStatus"}
            <div class="contentEncoding header-cell" title="Content-Encoding">Content-Encoding</div>
            {/if}
            
        </div>

        {#each entries as entry}
          <EntryRowCache
            {entry}
            {displayMode}
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
            {getHttpStatusDescription}
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
    width: 310px;
    min-width: 150px;
  }
  .domain {
    width: 150px;
    min-width: 150px;
  }
  
  .status {
    width: 50px;
    text-align: center;
  }
  .method {
    width: 70px;
    text-align: center;
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
  .cdnProvider {
    width: 140px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .cdnDataSource {
    width: 70px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  /* .cdnFromCDN {
    width: 73px;
    text-align: center;
  }
  .cdnFromOrigin {
    width: 73px;
    text-align: center;
  }
  .cdnFromDiskCache {
    width: 65px;
    text-align: center;
  } */
  .httpVersion{
    width:70px;
   }
  .cdnEdgelocation {
    width: 70px;
  }
  .cdnCacheStatus {
    width: 220px;
  }
  .cdnFreshness,
  .browserFreshness{
    width:92px;
    text-align: center;
  }
  .cacheStorage {
    width: 70px;
    text-align: center;
  }
  .cacheTTL {
    width: 120px;
    text-align: right;
  }
  .cachePolicy {
    width: 230px;
  }
  .age { width: 70px; text-align: right; }
  .etag{
    width: 310px;
  }
  .lastModified {
    width: 150px;
  }
  .vary { width: 220px; }
  .contentEncoding{
    width: 115px;
    text-align: right;
  }
  /* .cached {
    width: 60px;
    text-align: center;
  } */
  

  /* @media (max-width: 979px) {
    .cached {
      display: none;
    }
  } */

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
