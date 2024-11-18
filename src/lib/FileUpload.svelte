<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  function handleFileChange(event) {
    const file = event.target.files[0];
    // ファイルが選択されている場合のみイベントを発火
    if (file) {
      dispatch("upload", file);
    }
  }
</script>

<input type="file" accept=".har" on:change={handleFileChange} />
