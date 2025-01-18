<script>
  import WaterfallBar from "$lib/components/WaterfallBar.svelte";

  export let entry;
  export let entries = [];
  export let isIndented = false;
  export let hasPageInfo = false;
  export let selectedEntryIndexes;
  export let isPathTruncated;
  export let isDomainTruncated;
  export let toggleEntryDetails;
  export let handleKeyDown;
  export let selectedTabs;
  export let selectTab;
  export let normalizeHeaders;
  export let normalizePostData;
  export let httpStatusCSSClass;
  export let formatTime;
  export let formatBytes;
  export let truncateText;
  export let formatGMTtoUTC;
  export let formatToLocalTime;
  export let calculateBarWidth;
  export let calculateBarLeft;

  // エントリーのユニークIDを取得する関数
  const getEntryId = (entry) => {
    //console.log(entry);
    return [
      entry.pageref || "no-page", // ページ参照
      entry.url, // URL
      entry.timestamp, // タイムスタンプ
      entry.startedDateTime, // 開始時刻
    ].join("|");
  };
</script>

<div
  class="table-row {hasPageInfo ? 'indent' : ''} entry-row {isIndented
    ? 'page-entry'
    : ''}  text-gray-900 dark:text-gray-300 border-b border-solid border-gray-300 dark:border-gray-700"
  on:click={() => toggleEntryDetails(entry)}
  on:keydown={(e) => handleKeyDown(e, entry)}
  role="button"
  tabindex="0"
  class:selected={selectedEntryIndexes.has(getEntryId(entry))}
>
  <div class="path cell">
    {#if isIndented}
      <span class="entry-indent"></span>
    {/if}
    {#if entry.path.length > 50}
      <span title={entry.url}>
        {isPathTruncated ? truncateText(entry.path, 50) : entry.path}
      </span>
    {:else}
      <span title={entry.url}>
        {entry.path}
      </span>
    {/if}
  </div>

  <div class="domain cell">
    <span title={entry.domain}>
      {isDomainTruncated ? truncateText(entry.domain, 32) : entry.domain}
    </span>
  </div>

  <div class="method cell {entry.method}">{entry.method}</div>
  <div class="status cell {httpStatusCSSClass(entry.status)}">
    {entry.status}
  </div>
  <div class="type cell">{entry.type}</div>
  <div class="mimetype cell">{entry.responseMimeType}</div>
  <div class="sign cell">
    <table>
      <tr>
        <td class="auth"
          >{#if entry.hasHeaderAuthData}<span title="Authorization Header"
              >A</span
            >{/if}</td
        >
        <td class="postData"
          >{#if entry.requestPostData}<span title="Post Data">P</span>{/if}</td
        >
        <td class="queryParameter"
          >{#if entry.requestQueryString.length > 0}<span
              title="Query Parameter">Q</span
            >{/if}</td
        >
        <td class="cookies"
          >{#if entry.responseCookies.length > 0}<span title="Set-Cookie"
              >C</span
            >{/if}</td
        >
      </tr>
    </table>
  </div>
  <div class="timestamp cell">{entry.timestamp}</div>
  {#if entry.time < 1000}
    <div class="time cell" title="{entry.time.toFixed(0)} ms">
      {formatTime(entry.time)}
    </div>
  {:else}
    <div
      class="time cell"
      title="{entry.time.toFixed(0)} ms / {formatTime(entry.time)}"
    >
      {formatTime(entry.time)}
    </div>
  {/if}
  <!-- {console.log(entry.responseContentLength + ' / ' + formatBytes(entry.responseContentLength))} -->

  <div class="size cell">
    {formatBytes(entry.responseContentLength)}
    <!-- {typeof entry.responseContentLength !== "undefined"
      ? formatBytes(entry.responseContentLength)
      : ""} -->
  </div>
  <div class="cached cell">{entry.isCached ? entry.isCached : ""}</div>
  <!-- <div class="age cell">{entry.age !== null ? entry.age : ''}</div> -->

  <!-- <div class="dns cell">{entry.timings.dns >= 0 ? formatTime(entry.timings.dns) : ''}</div>
  <div class="connect cell">{entry.timings.connect >= 0 ? formatTime(entry.timings.connect) : ''}</div>
  <div class="ssl cell">{entry.timings.ssl >= 0 ? formatTime(entry.timings.ssl) : ''}</div>
  <div class="send cell">{formatTime(entry.timings.send)}</div>
  <div class="wait cell">{formatTime(entry.timings.wait)}</div>
  <div class="receive cell">{formatTime(entry.timings.receive)}</div> -->
  <div class="waterfall cell">
    <WaterfallBar
      {entry}
      {entries}
      {hasPageInfo}
      formatTime={(time) => `${time.toFixed(1)} ms`}
    />
  </div>
</div>

{#if selectedEntryIndexes.has(getEntryId(entry))}
  <div class="detail-row {hasPageInfo ? 'indent' : ''}">
    <div class="custom-tabs">
      <div class="tab-list">
        <button
          class="tab-button"
          class:active={selectedTabs.get(getEntryId(entry)) === "Headers"}
          on:click={() => selectTab(getEntryId(entry), "Headers")}
        >
          Headers
        </button>
        {#if entry.requestQueryString.length > 0 || entry.requestPostData}
          <button
            class="tab-button"
            class:active={selectedTabs.get(getEntryId(entry)) === "Payload"}
            on:click={() => selectTab(getEntryId(entry), "Payload")}
          >
            Payload
          </button>
        {/if}
        <!-- <button 
              class="tab-button" 
              class:active={selectedTabs.get(index) === 'Response'}
              on:click={() => selectTab(index, 'Response')}>
              Response
          </button>
          {#if entry.initiator}
              <button 
              class="tab-button" 
              class:active={selectedTabs.get(index) === 'Initiator'}
              on:click={() => selectTab(index, 'Initiator')}>
              Initiator
              </button>
          {/if} -->
        <button
          class="tab-button"
          class:active={selectedTabs.get(getEntryId(entry)) === "Timing"}
          on:click={() => selectTab(getEntryId(entry), "Timing")}
        >
          Timing
        </button>
        <button
          class="tab-button"
          class:active={selectedTabs.get(getEntryId(entry)) === "Cookies"}
          on:click={() => selectTab(getEntryId(entry), "Cookies")}
        >
          Cookies [{entry.responseCookies.length}]
        </button>
      </div>
      <div class="tab-content">
        {#if selectedTabs.get(getEntryId(entry)) === "Headers"}
          <!-- Headers content -->
          <div class="headers-container">
            <div class="header-general">
              <div class="header-title">General</div>
              <table>
                <tr><th>Request URL</th><td>{entry.url}</td></tr>
                <tr><th>Request Method</th><td>{entry.method}</td></tr>
                <tr><th>Status Code</th><td>{entry.status}</td></tr>
                <tr
                  ><th>Referer</th><td>{entry.referer ? entry.referer : ""}</td
                  ></tr
                >
              </table>
            </div>

            <div class="header-sections-wrapper">
              <div class="header-section">
                <div class="header-title">Response Headers</div>
                <div class="header-table">
                  <div class="table-header">
                    <div class="name-col">Name</div>
                    <div class="value-col">Value</div>
                  </div>
                  {#if entry.responseHeaderAll}
                    {@const headers = normalizeHeaders(entry.responseHeaderAll)}
                    {#if headers.length > 0}
                      {#each headers as header}
                        <div class="table-row">
                          <div class="name-col">{header.name}</div>
                          <div class="value-col">{header.value}</div>
                        </div>
                      {/each}
                    {:else}
                      <div class="table-row">
                        <div class="no-data">No response headers</div>
                      </div>
                    {/if}
                  {:else}
                    <div class="table-row">
                      <div class="no-data">No response headers</div>
                    </div>
                  {/if}
                </div>
              </div>

              <div class="header-section">
                <div class="header-title">Request Headers</div>
                <div class="header-table">
                  <div class="table-header">
                    <div class="name-col">Name</div>
                    <div class="value-col">Value</div>
                  </div>
                  {#if entry.requestHeaderAll}
                    {@const headers = normalizeHeaders(entry.requestHeaderAll)}
                    {#if headers.length > 0}
                      {#each headers as header}
                        <div class="table-row">
                          <div class="name-col">{header.name}</div>
                          <div class="value-col">{header.value}</div>
                        </div>
                      {/each}
                    {:else}
                      <div class="table-row">
                        <div class="no-data">No request headers</div>
                      </div>
                    {/if}
                  {:else}
                    <div class="table-row">
                      <div class="no-data">No request headers</div>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {:else if selectedTabs.get(getEntryId(entry)) === "Payload"}
          <!-- Payload content -->
          <div class="payload-container">
            <div class="payload-selections-wrapper">
              <!-- {console.log(entry.requestPostData)} -->
              {#if entry.requestQueryString.length > 0}
                <div class="payload-title">Querty Parameter</div>
                <table div class="payload-table queryParameter">
                  <tr>
                    <th class="payloadName name-col">Name</th>
                    <th class="payloadValue value-col">Value</th>
                  </tr>
                  {#each entry.requestQueryString as requestQueryString}
                    <tr>
                      <td class="payloadName name-col"
                        >{requestQueryString.name}</td
                      >
                      <td class="payloadValue value-col"
                        >{requestQueryString.value}</td
                      >
                    </tr>
                  {/each}
                </table>
              {/if}

              {#if entry.requestPostData}
                {@const postDataParams = normalizePostData(
                  entry.requestPostData,
                )}
                <div class="payload-title">Post Data</div>
                MimeType : {entry.requestPostData.mimeType}
                <table div class="payload-table postData">
                  <tr>
                    <th class="payloadName name-col">Name</th>
                    <th class="payloadValue value-col">Value</th>
                  </tr>
                  
                  <!-- #TODO postDataの値が2回表示されることがある -->
                  {#each postDataParams as param}
                    <tr>
                      <td class="payloadName name-col">{param.name}</td>
                      <td class="payloadValue value-col">{param.value}</td>
                    </tr>
                  {/each}
                </table>
              {/if}
            </div>
          </div>
        {:else if selectedTabs.get(getEntryId(entry)) === "Response"}
          <!-- Response content -->
        {:else if selectedTabs.get(getEntryId(entry)) === "Initiator" && entry._initiator}
          <!-- Initiator content -->
        {:else if selectedTabs.get(getEntryId(entry)) === "Timing"}
          <!-- Timing content -->
          <div class="timing-container p-4 bg-white rounded-lg">
            <!-- <div class="mb-4 text-gray-700">
                  {entry.timings}
                  <div class="text-sm">Queued at {formatTimestamp(new Date(entry.startedDateTime))}</div>
                  <div class="text-sm">Started at {calculateStartTime(entry.startedDateTime, entry.timings.blocked)}</div>
              </div> -->

            <div class="space-y-6">
              <!-- Resource Scheduling -->
              <div>
                <div class="text-sm text-gray-600 mb-2">
                  Resource Scheduling
                </div>
                <div class="flex justify-between items-center mb-1">
                  <div class="text-sm w-32">Queueing</div>
                  <div class="timing-bar-container">
                    {#if entry.timings.blocked >= 0}
                      <div
                        class="absolute bg-gray-400"
                        style="width: {calculateBarWidth(
                          entry.timings.blocked,
                          entry.time,
                        )}%; height: 100%; left: 0%"
                      ></div>
                    {/if}
                  </div>
                  <div class="text-sm w-24 text-right">
                    {entry.timings.blocked >= 0
                      ? formatTime(entry.timings.blocked)
                      : "-"}
                  </div>
                </div>
              </div>

              <!-- Connection Start -->
              <div>
                <div class="text-sm text-gray-600 mb-2">Connection Start</div>
                <div class="space-y-1">
                  <!-- DNS Lookup -->
                  <div class="flex justify-between items-center">
                    <div class="text-sm w-32">DNS Lookup</div>
                    <div class="timing-bar-container">
                      {#if entry.timings.dns >= 0}
                        <div
                          class="absolute bg-blue-400"
                          style="width: {calculateBarWidth(
                            entry.timings.dns,
                            entry.time,
                          )}%; 
                                      height: 100%; 
                                      left: {calculateBarLeft(
                            entry.timings,
                            'dns',
                            entry.time,
                          )}%"
                        ></div>
                      {/if}
                    </div>
                    <div class="text-sm w-24 text-right">
                      {entry.timings.dns >= 0
                        ? formatTime(entry.timings.dns)
                        : "-"}
                    </div>
                  </div>

                  <!-- Initial connection -->
                  <div class="flex justify-between items-center">
                    <div class="text-sm w-32">Initial connection</div>
                    <div class="timing-bar-container">
                      {#if entry.timings.connect >= 0}
                        <div
                          class="absolute bg-orange-400"
                          style="width: {calculateBarWidth(
                            entry.timings.connect,
                            entry.time,
                          )}%; 
                                      height: 100%; 
                                      left: {calculateBarLeft(
                            entry.timings,
                            'connect',
                            entry.time,
                          )}%"
                        ></div>
                      {/if}
                    </div>
                    <div class="text-sm w-24 text-right">
                      {entry.timings.connect >= 0
                        ? formatTime(entry.timings.connect)
                        : "-"}
                    </div>
                  </div>

                  <!-- SSL -->
                  <div class="flex justify-between items-center">
                    <div class="text-sm w-32">SSL</div>
                    <div class="timing-bar-container">
                      {#if entry.timings.ssl >= 0}
                        <div
                          class="absolute bg-purple-400"
                          style="width: {calculateBarWidth(
                            entry.timings.ssl,
                            entry.time,
                          )}%; 
                                      height: 100%; 
                                      left: {calculateBarLeft(
                            entry.timings,
                            'ssl',
                            entry.time,
                          )}%"
                        ></div>
                      {/if}
                    </div>
                    <div class="text-sm w-24 text-right">
                      {entry.timings.ssl >= 0
                        ? formatTime(entry.timings.ssl)
                        : "-"}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Request/Response -->
              <div>
                <div class="text-sm text-gray-600 mb-2">Request/Response</div>
                <div class="space-y-1">
                  <!-- Request sent -->
                  <div class="flex justify-between items-center">
                    <div class="text-sm w-32">Request sent</div>
                    <div class="timing-bar-container">
                      {#if entry.timings.send >= 0}
                        <div
                          class="absolute bg-cyan-500"
                          style="width: {calculateBarWidth(
                            entry.timings.send,
                            entry.time,
                          )}%; 
                                      height: 100%; 
                                      left: {calculateBarLeft(
                            entry.timings,
                            'send',
                            entry.time,
                          )}%"
                        ></div>
                      {/if}
                    </div>
                    <div class="text-sm w-24 text-right">
                      {formatTime(entry.timings.send)}
                    </div>
                  </div>

                  <!-- Waiting (TTFB) -->
                  <div class="flex justify-between items-center">
                    <div class="text-sm w-32">Waiting (TTFB)</div>
                    <div class="timing-bar-container">
                      {#if entry.timings.wait >= 0}
                        <div
                          class="absolute bg-green-500"
                          style="width: {calculateBarWidth(
                            entry.timings.wait,
                            entry.time,
                          )}%; 
                                      height: 100%; 
                                      left: {calculateBarLeft(
                            entry.timings,
                            'wait',
                            entry.time,
                          )}%"
                        ></div>
                      {/if}
                    </div>
                    <div class="text-sm w-24 text-right">
                      {formatTime(entry.timings.wait)}
                    </div>
                  </div>

                  <!-- Content Download -->
                  <div class="flex justify-between items-center">
                    <div class="text-sm w-32">Content Download</div>
                    <div class="timing-bar-container">
                      {#if entry.timings.receive >= 0}
                        <div
                          class="absolute bg-blue-500"
                          style="width: {calculateBarWidth(
                            entry.timings.receive,
                            entry.time,
                          )}%; 
                                      height: 100%; 
                                      left: {calculateBarLeft(
                            entry.timings,
                            'receive',
                            entry.time,
                          )}%"
                        ></div>
                      {/if}
                    </div>
                    <div class="text-sm w-24 text-right">
                      {formatTime(entry.timings.receive)}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Total -->
              <div
                class="flex justify-between items-center pt-4 border-t border-gray-200"
              >
                <div class="text-sm font-medium">Total</div>
                <div class="text-sm font-medium">{formatTime(entry.time)}</div>
              </div>
            </div>
          </div>
        {:else if selectedTabs.get(getEntryId(entry)) === "Cookies"}
          <!-- Cookies content -->
          <div class="cookies-container">
            <div class="cookies-sections-wrapper">
              <div class="cookies-section">
                <div class="cookies-title">Set-Cookies (Response Cookies)</div>
                <div class="cookies-table">
                  <table>
                    {#if entry.responseCookies.length > 0}
                      <tr>
                        <th class="cookieName">Name</th>
                        <th class="cookieValue">Value</th>
                        <th class="cookiePath">Path</th>
                        <th class="cookieDomain">Domain</th>
                        <th class="cookieExpires">Expires</th>
                        <th class="cookieHttpOnly">HttpOnly</th>
                        <th class="cookieSecure">Secure</th>
                        <th class="cookieMaxAge">MaxAge</th>
                        <th class="cookieComment">Comment</th>
                      </tr>
                      {#each entry.responseCookies as entryResponseCookie}
                        <tr>
                          <td class="cookieName">{entryResponseCookie.name}</td>
                          <td class="cookieValue"
                            >{entryResponseCookie.value}</td
                          >
                          <td class="cookiePath">{entryResponseCookie.path}</td>
                          <td class="cookieDomain"
                            >{entryResponseCookie.domain
                              ? entryResponseCookie.domain
                              : "null (" + entry.domain + ")"}</td
                          >
                          <!-- <td class="cookieExpires">{entryResponseCookie.expires ? entryResponseCookie.expires : '(Session Cookie)'}</td> -->
                          <td
                            class="cookieExpires"
                            title={entryResponseCookie.expires
                              ? formatToLocalTime(entryResponseCookie.expires)
                              : ""}
                          >
                            {entryResponseCookie.expires
                              ? formatGMTtoUTC(entryResponseCookie.expires)
                              : "(Session Cookie)"}
                          </td>
                          <td class="cookieHttpOnly"
                            >{entryResponseCookie.httpOnly
                              ? entryResponseCookie.httpOnly
                              : ""}</td
                          >
                          <td class="cookieSecure"
                            >{entryResponseCookie.secure}</td
                          >
                          <td class="cookieMaxAge"
                            >{entryResponseCookie._maxAge
                              ? entryResponseCookie._maxAge
                              : ""}</td
                          >
                          <td class="cookieComment"
                            >{entryResponseCookie.comment
                              ? entryResponseCookie.comment
                              : ""}</td
                          >
                        </tr>
                      {/each}
                    {:else}
                      <tr><td>No Set-Cookies (Response Cookies)</td></tr>
                    {/if}
                  </table>
                </div>
              </div>

              <div class="cookies-section">
                <div class="cookies-title">Request Cookies</div>
                <div class="cookies-table">
                  <table>
                    {#if entry.requestCookies.length > 0}
                      <tr>
                        <th class="cookieName">Name</th>
                        <th class="cookieValue">Value</th>
                      </tr>
                      {#each entry.requestCookies as entryRequestCookie}
                        <tr>
                          <td class="cookieName">{entryRequestCookie.name}</td>
                          <td class="cookieValue">{entryRequestCookie.value}</td
                          >
                        </tr>
                      {/each}
                    {:else}
                      <tr><td>No request Cookies</td></tr>
                    {/if}
                  </table>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .request-detail-table {
    width: 100%;
    overflow-x: auto;
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

  .table-body {
    display: flex;
    flex-direction: column;
  }

  .table-row {
    display: flex;
    /* border-bottom: 1px solid #eee; */
    padding: 0 0.5rem;
  }

  :global(.dark .table-row) {
    /* border-bottom: 1px solid #333; */
  }


  .header-cell,
  .cell {
    padding: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sign.cell {
    padding: 0;
  }

  .header-cell {
    font-weight: bold;
  }

  .cell.waterfall {
    overflow: visible;
  }

  .path {
    width: 20%;
    min-width: 150px;
  }
  .domain {
    width: 10%;
    min-width: 150px;
  }
  /* .path { width: 250px; }
  .domain { width: 210px; } */
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
  /* .age { width: 60px; text-align: right; } */
  .dns {
    width: 60px;
    text-align: right;
  }
  .connect {
    width: 60px;
    text-align: right;
  }
  .ssl {
    width: 60px;
    text-align: right;
  }
  .send {
    width: 60px;
    text-align: right;
  }
  .wait {
    width: 60px;
    text-align: right;
  }
  .receive {
    width: 60px;
    text-align: right;
  }

  :global(.sign table td) {
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

    /* .path { 
      width: 30%; 
    }
    .domain { 
      width: 30%; 
    } */
  }

  .status.info,
  .status.success {
    /* background: #99ffa2; */
    background: rgb(49 196 141 / 0.6);
  }

  .status.redirect {
    background: #ebe15c;
  }

  .status.cliError {
    background: rgb(255, 153, 161);
  }

  .status.srvError {
    background: #ff4554;
    color: #fff;
  }

  .status.other {
    background: #eee;
  }

  .detail-row {
    border-bottom: 1px solid #eee;
    box-shadow: 0px 0px 2px 0px inset #999;
    margin: 0 0 10px 10px;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 10px;
  }

  .detail-row.indent {
    margin: 0 0 10px 30px;
  }

  .table-row:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }

  /* .table-row.selected {
    background-color: rgba(0, 0, 0, 0.05);
  } */
  .table-row.selected {
    /* box-shadow: 2px 2px 4px -2px #666 */
    box-shadow: 4px 1px 10px -3px #666;
  }

  .table-row:focus {
    /* outline: 1px solid #023480;
    outline-offset: -2px; */
  }

  /* .header-cell button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 2px;
    background: none;
    border: none;
    cursor: pointer;
  } */

  .custom-tabs {
    background-color: #f8f9fa;
    /* border: 1px solid #e9ecef; */
    /* border-radius: 4px; */
    /* margin: 4px; */
    margin: 10px 0 10px 20px;
    width: 90%;
  }

  .tab-list {
    display: flex;
    border-bottom: 1px solid #dee2e6;
    background-color: #f8f9fa;
    height: 24px;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .tab-button {
    padding: 2px 8px;
    background: none;
    border: none;
    font-size: 0.75rem;
    color: #6c757d;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
  }

  .tab-button:hover {
    color: #495057;
  }

  .tab-button.active {
    color: #0d6efd;
    border-bottom-color: #0d6efd;
  }

  .tab-content {
    padding: 8px;
    font-size: 0.75rem;
    /* max-height: 200px; */
    overflow-y: auto;
  }

  .header-general {
    margin-bottom: 10px;
  }
  .header-general table {
    width: 100%;
  }

  .header-general th {
    text-align: right;
    border-bottom: 1px solid #e5e7eb;
    padding: 0 4px;
    width: 200px;
  }
  .header-general td {
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
    padding: 0 4px;
    word-break: break-all;
  }

  .headers-container,
  .payload-container,
  .cookies-container {
    font-size: 0.75rem;
    margin: -4px 0;
  }

  .header-sections-wrapper,
  .payload-sections-wrapper,
  .cookies-sections-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* 980px以上の場合のスタイル */
  @media (min-width: 980px) {
    .header-sections-wrapper {
      flex-direction: row;
      align-items: flex-start;
    }

    .header-section {
      flex: 1;
      min-width: 0; /* flexboxでの縮小を許可 */
    }

    /* 左右の間にスペースを追加 */
    .header-section:first-child {
      margin-right: 4px;
    }

    .header-section:last-child {
      margin-left: 4px;
    }
  }

  .header-title,
  .payload-title,
  .cookies-title {
    font-weight: 600;
    color: #1a1a1a;
    padding: 2px 0;
  }

  .header-table,
  .cookies-table {
    width: 100%;
    /* border: 1px solid #e5e7eb; */
    border-radius: 4px;
    overflow: hidden;
  }

  .header-table .table-header {
    display: flex;
    background-color: #f3f4f6;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-table .table-row {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-table .table-row:last-child {
    border-bottom: none;
  }

  .name-col {
    width: 200px;
    padding: 0 4px;
    /*border-right: 1px solid #e5e7eb;*/
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: bold;
    text-align: right;
  }

  .value-col {
    flex: 1;
    padding: 0 4px;
    /* overflow: hidden; */
    text-overflow: ellipsis;
    /* white-space: nowrap; */
    word-break: break-all;
  }

  .queryParameter th.name-col,
  .queryParameter th.value-col {
    background-color: #f3f4f6;
  }

  .table-header .name-col,
  .table-header .value-col {
    background-color: #f3f4f6;
  }

  .cookies-table tr th {
    padding: 2px;
    background-color: #f3f4f6;
    border: 1px solid #ccc;
    font-weight: bold;
  }
  .cookies-table td {
    border: 1px solid #ccc;
    padding: 2px;
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

  .timing-container {
    /* font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; */
    width: 100%;
  }
  @media (min-width: 980px) {
    .timing-container {
      width: 70%;
    }
  }

  .timing-bar-container {
    position: relative;
    flex-grow: 1;
    height: 16px;
    margin: 0 12px;
    background-color: #f3f4f6;
    border-radius: 4px;
    overflow: hidden;
  }

  /* タイミングバーのホバー効果 */
  .timing-bar-container:hover {
    background-color: #e5e7eb;
  }

  .page-header {
    border-bottom: 1px solid #e5e7eb;
  }

  .page-entry {
    padding-left: 1.5rem;
    position: relative;
  }

  .page-entry::before {
    content: "";
    position: absolute;
    left: 0.75rem;
    top: 50%;
    width: 0.5rem;
    height: 1px;
    background-color: #e5e7eb;
  }

  .entry-indent {
    display: inline-block;
    width: 1rem;
  }

  /* ホバー効果の調整 */
  .table-row:hover {
    background-color: rgba(243, 244, 246, 0.8);
  }

  .page-header:hover {
    background-color: rgba(243, 244, 246, 0.5);
  }

  :global(.table-row.indent) {
    margin-left: 30px;
  }
  .waterfall {
    flex: 1;
    min-width: 150px;
    overflow: visible;
  }
  /* .waterfall {
        width: 256px;
        padding: 2px;
    }
    

    :global(th.waterfall) {
        width: 256px;
    } */
</style>
