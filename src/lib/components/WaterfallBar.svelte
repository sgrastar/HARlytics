<script>
  export let entry;
  export let entries = [];
  export let hasPageInfo = false;
  export let formatTime; // Add time format function

  // Get base time per page
  $: pageEntries =
    hasPageInfo && entry?.pageref
      ? entries.filter((e) => e.pageref === entry.pageref)
      : entries;

  // Get the first request time within the page as base time
  $: baseTime = Math.min(
    ...pageEntries.map((e) => new Date(e.startedDateTime).getTime()),
  );

  // Calculate total time span within the page
  $: totalDuration = Math.max(
    ...pageEntries.map(
      (e) => new Date(e.startedDateTime).getTime() + e.time - baseTime,
    ),
  );

  // Calculate entry start position (limited to not exceed 100%)
  $: entryStartPosition = Math.min(
    ((new Date(entry.startedDateTime).getTime() - baseTime) / totalDuration) *
      100,
    100,
  );

  // Calculate bar width (limited to not exceed 100% minus start position)
  function calculateBarWidth(duration) {
    const width = (duration / totalDuration) * 100;
    const remainingSpace = 100 - entryStartPosition;
    return Math.min(width, remainingSpace);
  }

  // Calculate hover info display position
  let tooltipVisible = false;
  let container;

  function handleMouseMove(event) {
    tooltipVisible = true;
    // Simplify mouse position calculation
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;

    // Set position using CSS custom property
    container.style.setProperty("--tooltip-x", `${x}px`);
  }

  function handleMouseLeave() {
    tooltipVisible = false;
  }

  // Get and validate each timing value
  $: timings = {
    blocked: entry?.timings?.blocked >= 0 ? entry.timings.blocked : 0,
    dns: entry?.timings?.dns >= 0 ? entry.timings.dns : 0,
    connect: entry?.timings?.connect >= 0 ? entry.timings.connect : 0,
    ssl: entry?.timings?.ssl >= 0 ? entry.timings.ssl : 0,
    send: entry?.timings?.send >= 0 ? entry.timings.send : 0,
    wait: entry?.timings?.wait >= 0 ? entry.timings.wait : 0,
    receive: entry?.timings?.receive >= 0 ? entry.timings.receive : 0,
  };

  // Calculate start position for each phase (relative position from entry start)
  $: startPositions = {
    blocked: 0,
    dns: Math.min(timings.blocked, totalDuration),
    connect: Math.min(timings.blocked + timings.dns, totalDuration),
    ssl: Math.min(
      timings.blocked + timings.dns + timings.connect,
      totalDuration,
    ),
    send: Math.min(
      timings.blocked + timings.dns + timings.connect + timings.ssl,
      totalDuration,
    ),
    wait: Math.min(
      timings.blocked +
        timings.dns +
        timings.connect +
        timings.ssl +
        timings.send,
      totalDuration,
    ),
    receive: Math.min(
      timings.blocked +
        timings.dns +
        timings.connect +
        timings.ssl +
        timings.send +
        timings.wait,
      totalDuration,
    ),
  };

  // Function to calculate timing bar display
  function calculateBarPosition(startPos, duration) {
    const left = Math.min(
      entryStartPosition + (startPos / totalDuration) * 100,
      100,
    );
    const width = Math.min(calculateBarWidth(duration), 100 - left);
    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="waterfall-container bg-gray-200 dark:bg-gray-700"
  bind:this={container}
  on:mousemove={handleMouseMove}
  on:mouseleave={handleMouseLeave}
>
  <!-- <div class="absolute inset-0 grid" style="grid-template-columns: repeat(20, 1fr)">
        {#each Array(20) as _, i}
            <div class="h-full border-r border-gray-200"></div>
        {/each}
    </div> -->

  <!-- Timing bars -->
  {#if timings.blocked > 0}
    {@const pos = calculateBarPosition(startPositions.blocked, timings.blocked)}
    <div
      class="absolute h-full bg-gray-400"
      style="left: {pos.left}; width: {pos.width};"
    ></div>
  {/if}

  {#if timings.dns > 0}
    {@const pos = calculateBarPosition(startPositions.dns, timings.dns)}
    <div
      class="absolute h-full bg-blue-400"
      style="left: {pos.left}; width: {pos.width};"
    ></div>
  {/if}

  {#if timings.connect > 0}
    {@const pos = calculateBarPosition(startPositions.connect, timings.connect)}
    <div
      class="absolute h-full bg-orange-400"
      style="left: {pos.left}; width: {pos.width};"
    ></div>
  {/if}

  {#if timings.ssl > 0}
    {@const pos = calculateBarPosition(startPositions.ssl, timings.ssl)}
    <div
      class="absolute h-full bg-purple-400"
      style="left: {pos.left}; width: {pos.width};"
    ></div>
  {/if}

  {#if timings.send > 0}
    {@const pos = calculateBarPosition(startPositions.send, timings.send)}
    <div
      class="absolute h-full bg-cyan-400"
      style="left: {pos.left}; width: {pos.width};"
    ></div>
  {/if}

  {#if timings.wait > 0}
    {@const pos = calculateBarPosition(startPositions.wait, timings.wait)}
    <div
      class="absolute h-full bg-green-400"
      style="left: {pos.left}; width: {pos.width};"
    ></div>
  {/if}

  {#if timings.receive > 0}
    {@const pos = calculateBarPosition(startPositions.receive, timings.receive)}
    <div
      class="absolute h-full bg-blue-400"
      style="left: {pos.left}; width: {pos.width};"
    ></div>
  {/if}

  {#if tooltipVisible}
    <div class="tooltip">
      <div class="tooltip-content">
        {#if timings.dns > 0}
          <span class="dns">DNS: {formatTime(timings.dns)}</span>
        {/if}
        {#if timings.connect > 0}
          <span class="connect">Connect: {formatTime(timings.connect)}</span>
        {/if}
        {#if timings.ssl > 0}
          <span class="ssl">SSL: {formatTime(timings.ssl)}</span>
        {/if}
        <span class="send">Send: {formatTime(timings.send)}</span>
        <span class="wait">Wait: {formatTime(timings.wait)}</span>
        <span class="receive">Receive: {formatTime(timings.receive)}</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .absolute {
    position: absolute;
  }
  /* .relative {
      position: relative;
    } */
  .h-full {
    height: 100%;
  }
  /* .w-full {
      width: 100%;
    }
    .h-4 {
      height: 1rem;
    }
    .bg-gray-100 {
      background-color: #f3f4f6;
    }
    .rounded {
      border-radius: 0.25rem;
    }
    .overflow-hidden {
      overflow: hidden;
    }
    .inset-0 {
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
    }
    .grid {
      display: grid;
    }
    .border-r {
      border-right-width: 1px;
    }
    .border-gray-200 {
      border-color: #e5e7eb;
    } */

  .waterfall-container {
    position: relative;
    width: 100%;
    height: 1rem;
    /* background-color: #f3f4f6; */
    border-radius: 0.25rem;
    --tooltip-x: 0px;
    /* overflow: hidden;  Prevent overflow */
  }
  /* 
    .grid-lines {
        position: absolute;
        inset: 0;
        display: grid;
        grid-template-columns: repeat(20, 1fr);
    }

    .grid-line {
        height: 100%;
        border-right: 1px solid #e5e7eb;
    }

    .timing-bar {
        position: absolute;
        height: 100%;
    } */

  .tooltip {
    position: absolute;
    left: var(--tooltip-x);
    top: -2px;
    transform: translateY(-100%);
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 4px 8px;
    z-index: 1000;
    font-size: 11px;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .tooltip-content {
    display: flex;
    gap: 8px;
    flex-direction: column;
  }

  .tooltip span {
    display: inline-block;
    align-items: center;
  }

  /* Color definitions */
  /* .blocked { background-color: #9ca3af; } */
  .dns {
    color: #60a5fa;
  }
  .connect {
    color: #f97316;
  }
  .ssl {
    color: #a855f7;
  }
  .send {
    color: #06b6d4;
  }
  .wait {
    color: #22c55e;
  }
  .receive {
    color: #3b82f6;
  }

  /* Divider lines */
  .tooltip span:not(:last-child)::after {
    content: "|";
    margin-left: 8px;
    color: #e5e7eb;
  }
</style>
