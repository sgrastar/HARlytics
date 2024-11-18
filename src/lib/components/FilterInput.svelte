<script context="module">
  export const prerender = true;
</script>

<script>
  let inputValue = "";
  let tags = [];

  function handleKeyDown(event) {
    if (event.key === "," && inputValue.trim() !== "") {
      tags = [...tags, inputValue.trim()];
      inputValue = "";
    }
  }

  function removeTag(index) {
    tags = tags.filter((_, i) => i !== index);
  }

  export { inputValue, tags };
</script>

<div class="filter-input">
  <input
    type="text"
    bind:value={inputValue}
    on:keydown={handleKeyDown}
    placeholder="Enter keywords, separated by commas"
  />
  {#each tags as tag, index}
    <span class="tag">
      {tag}
      <button class="remove-tag" on:click={() => removeTag(index)}
        >&times;</button
      >
    </span>
  {/each}
</div>

<style>
  .filter-input {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border: 1px solid #ccc;
    border-radius: 4px;
    min-height: 32px;
  }

  .tag {
    display: flex;
    align-items: center;
    padding: 2px 4px;
    background-color: #eee;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
  }

  .remove-tag {
    margin-left: 4px;
    padding: 0;
    background: none;
    border: none;
    font-size: 14px;
    cursor: pointer;
  }

  input {
    flex-grow: 1;
    border: none;
    outline: none;
    font-size: 14px;
    min-width: 100px;
  }
</style>
