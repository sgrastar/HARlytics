<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  function handleFileChange(event) {
    const file = event.target.files[0];
    // Fire event only when a file is selected
    if (file) {
      dispatch("upload", file);
    }
  }
</script>

<input type="file" accept=".har" on:change={handleFileChange} />
