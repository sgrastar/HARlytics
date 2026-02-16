<script>
  import "../app.css";
  import { onMount } from "svelte";
  import { Badge, Button, Modal, DarkMode  } from "flowbite-svelte";
  import CustomDarkMode from "../lib/components/CustomDarkMode.svelte";
  import {
    GithubSolid,
    HomeSolid
  } from "flowbite-svelte-icons";

  let isLive = false;
  let scrollingModal = false;
  let licenseText = "";
  let mounted = false;
  let fadeOut = false;

  let btnClass = 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xl p-2';

  onMount(async () => {
    if (typeof window !== "undefined") {
      isLive = window.location.protocol !== "chrome-extension:";
    }
    const response = await fetch("licenses.txt");
    licenseText = await response.text();

    // Splash screen control
    setTimeout(() => {
      mounted = true;
    }, 100);

    setTimeout(() => {
      fadeOut = true;
    }, 2500);
  });
</script>

{#if !fadeOut}
  <div
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-100
  transition-opacity duration-1000 ease-in-out {mounted
      ? 'opacity-100'
      : 'opacity-100'}"
  >
    <div
      class="text-center transform transition-all duration-1000 ease-in-out
    {mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}"
    >
      <h1 class="text-4xl font-bold text-black mb-4">
        <img
          src="favicon.png"
          alt="logo"
          style="display: inline-block; width:.75em"
        /> HARlytics
      </h1>
      <p
        class="text-gray-600"
        style="text-align-last: justify; font-family:serif"
      >
        {mounted ? "Making HTTP tell its story" : "Loading..."}
      </p>
    </div>
  </div>
{/if}

<div
  class="transition-opacity duration-500 {fadeOut
    ? 'opacity-100'
    : 'opacity-0'}"
>
  <header class="text-white body-font bg-gray-800">
    <div
      class=" mx-auto flex flex-wrap px-4 py-1 flex-col md:flex-row items-center"
    >
      <div style="display: flex; flex-direction: row;">
        <div style="display: flex; align-items: center;">
          <img
            src="favicon.png"
            alt="logo"
            style="display: inline-block; margin-right:.5em"
            width="15px"
            height="15px"
          />
          <span class="">HARlytics</span>
        </div>
      </div>

      <nav
        class="md:ml-auto flex flex-wrap items-center space-x-2 text-base justify-center"
      >
      <!-- <DarkMode {btnClass} /> -->
      <CustomDarkMode {btnClass} />
      <div id="buildTimestamp" class="text-xs" title="Build: 2026-02-16 11:41:06 UTC">v0.6.0</div>
      <div class="text-xs"><a href="https://github.com/sgrastar/HARlytics/releases" target="_blank">Release Note</a></div>
        {#if isLive}
          <Badge large color="indigo" class="ml-4" data-testid="cloud-edition-badge">Cloud Edition</Badge>
        {/if}
        <Button
          color="light"
          size="sm"
          class=" px-2 py-0"
          on:click={() => (scrollingModal = true)}
          autoclose>License</Button
        >
        <a href="https://harlytics.com/" target="_blank" title="HARlytics.com">
          <HomeSolid />
        </a>
        <a href="https://github.com/sgrastar/HARlytics" target="_blank" title="GitHub">
          <GithubSolid />
        </a>
      </nav>
    </div>
  </header>

  <Modal title="License" bind:open={scrollingModal}>
    <h3 class="text-lg font-semibold">HARlytics</h3>
    <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
      The MIT License (MIT)
    </p>
    <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
      Copyright (c) 2024 Yuta Hoshina &lt;yuta@sgrastar.org&gt;<br />
      (<a href="https://github.com/sgrastar/HARlytics" target="_blank"
        >https://github.com/sgrastar/HARlytics</a
      >)
    </p>

    <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
      Permission is hereby granted, free of charge, to any person obtaining a
      copy of this software and associated documentation files (the "Software"),
      to deal in the Software without restriction, including without limitation
      the rights to use, copy, modify, merge, publish, distribute, sublicense,
      and/or sell copies of the Software, and to permit persons to whom the
      Software is furnished to do so, subject to the following conditions:
    </p>

    <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
      The above copyright notice and this permission notice shall be included in
      all copies or substantial portions of the Software.
    </p>

    <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
      THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
      FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
      DEALINGS IN THE SOFTWARE.
    </p>
    <hr />
    <pre
      style="width: 100%;white-space: pre-wrap; font-size:75%;">{licenseText}</pre>
  </Modal>

  <slot />
</div>

<style>
  /* Add the following as global styles */
  :global(body) {
    transition: background-color 0.5s ease, color 0.5s ease;
  }
  :global(*) {
    transition: background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease;
  }
  
  /* Specify classes for elements that need immediate hover effects */
  :global(.entry-row) {
    transition: none !important;
  }
  
  /* Or exclude only hover states */
  :global(.entry-row:hover) {
    transition: none !important;
  }
</style>

