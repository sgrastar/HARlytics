<script>
  import { formatTimestamp, filterCookieChanges } from "$lib/utils";

  export let cookieChanges = [];
  let filters = {
    urlFilter: "",
    notUrlFilter: "",
    selectedCookies: [],
  };

  $: filteredChanges = filterCookieChanges(cookieChanges, filters);
  $: cookieNames = Array.from(
    new Set(
      cookieChanges.flatMap((change) =>
        change.cookies.map((cookie) => cookie.name),
      ),
    ),
  );

  function handleUrlFilterChange(event) {
    filters.urlFilter = event.target.value;
  }

  function handleNotUrlFilterChange(event) {
    filters.notUrlFilter = event.target.value;
  }

  function handleCookieSelect(cookieName) {
    if (filters.selectedCookies.includes(cookieName)) {
      filters.selectedCookies = filters.selectedCookies.filter(
        (name) => name !== cookieName,
      );
    } else {
      filters.selectedCookies = [...filters.selectedCookies, cookieName];
    }
  }

  function truncateText(text) {
    if (text.length <= 40) {
      return text;
    } else {
      return text.substring(0, 40) + "...";
    }
  }
</script>

<div>
  <div>
    <label for="urlFilter">Filter by URL (separate by |):</label>
    <input type="text" id="urlFilter" on:input={handleUrlFilterChange} />
  </div>
  <div>
    <label for="notUrlFilter">Exclude URLs containing (separate by |):</label>
    <input type="text" id="notUrlFilter" on:input={handleNotUrlFilterChange} />
  </div>
  {#if filteredChanges.length > 0}
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>URL</th>
          {#each cookieNames as name}
            <th>
              <input
                type="checkbox"
                checked={filters.selectedCookies.includes(name)}
                on:change={() => handleCookieSelect(name)}
              />
              {name}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each filteredChanges as change}
          <tr>
            <td>{formatTimestamp(change.timestamp)}</td>
            <td>{truncateText(change.url)}</td>
            {#each cookieNames as name}
              {@const cookie = change.cookies.find(
                (cookie) => cookie.name === name,
              )}
              <td>
                {#if cookie}
                  {truncateText(cookie.value)}
                {:else}
                  {""}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p>No data to display.</p>
  {/if}
</div>
