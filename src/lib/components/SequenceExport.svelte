<script>
    import { Button, Input, Label, Radio } from 'flowbite-svelte';
    import { DownloadSolid, FileCopySolid, WindowSolid } from 'flowbite-svelte-icons';
  
    // Props
    export let logFilename = '';
  
    // State variables
    let imageFormat = 'png';
    let sizeMode = 'auto';
    let customSize = 1080;
    let isTransparent = true;
    let filename = `Sequence_${logFilename || 'diagram'}.png`;
  
    // For copy status feedback
    let copyStatus = '';
    let copyStatusTimeout;
  
    // Update filename when format changes
    $: {
      if (filename) {
        filename = filename.replace(/\.(png|svg)$/, `.${imageFormat}`);
      }
    }

    // Get image blob with current settings
    async function getImageBlob() {
        const svg = document.querySelector("#graph svg");
        if (!svg) return null;

        const svgData = new XMLSerializer().serializeToString(svg);
        
        if (imageFormat === 'svg') {
            // SVGの場合はMIMEタイプを修正
            return new Blob([svgData], { type: 'image/svg+xml' });
        } else {
            // PNG処理は変更なし
            return new Promise((resolve) => {
            const canvas = document.createElement("canvas");
            const svgSize = svg.getBoundingClientRect();
            
            let width = svgSize.width;
            let height = svgSize.height;
            const aspectRatio = width / height;
            
            if (sizeMode === 'width') {
                width = customSize;
                height = width / aspectRatio;
            } else if (sizeMode === 'height') {
                height = customSize;
                width = height * aspectRatio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext("2d");
            if (!isTransparent) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, width, height);
            }
            
            const image = new Image();
            image.onload = () => {
                ctx.drawImage(image, 0, 0, width, height);
                canvas.toBlob((blob) => resolve(blob), 'image/png');
            };
            
            const base64Data = btoa(unescape(encodeURIComponent(svgData)));
            image.src = `data:image/svg+xml;base64,${base64Data}`;
            });
        }
        }
  
    // Export diagram function
    async function exportDiagram() {
      const blob = await getImageBlob();
      if (!blob) return;
  
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    // Copy to clipboard function
    async function copyToClipboard() {
        try {
            const svg = document.querySelector("#graph svg");
            if (!svg) return;

            if (imageFormat === 'svg') {
            // SVGの場合はテキストとしてコピー
            const svgData = new XMLSerializer().serializeToString(svg);
            await navigator.clipboard.writeText(svgData);
            } else {
            // PNGの場合は画像としてコピー
            const blob = await getImageBlob();
            if (!blob) return;
            await navigator.clipboard.write([
                new ClipboardItem({
                [blob.type]: blob
                })
            ]);
            }

            showCopyStatus('Copied!');
        } catch (err) {
            showCopyStatus('Failed to copy');
            console.error('Failed to copy image:', err);
        }
    }
  
    // Show preview in new tab
    async function showPreview() {
        const svg = document.querySelector("#graph svg");
        if (!svg) return;

        if (imageFormat === 'svg') {
            // SVGの場合は直接HTMLとして新しいタブで開く
            const svgData = new XMLSerializer().serializeToString(svg);
            const html = `
            <!DOCTYPE html>
            <html>
                <head>
                <title>SVG Preview</title>
                <style>
                    body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                    svg { max-width: 100%; height: auto; }
                </style>
                </head>
                <body>${svgData}</body>
            </html>
            `;
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else {
            // PNGの場合は従来通り
            const blob = await getImageBlob();
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }
  
    // Show copy status feedback
    function showCopyStatus(status) {
      copyStatus = status;
      clearTimeout(copyStatusTimeout);
      copyStatusTimeout = setTimeout(() => {
        copyStatus = '';
      }, 2000);
    }
</script>
  
<div class="">
  <div class="grid grid-cols-2 p-2" style="display: flex; flex-direction: column;">
    <!-- Left column -->
    <div style="display: flex; flex-direction: column;">
      <div class="mb-3">
        <Label class="mb-2">Export Format</Label>
        <div class="flex gap-4">
          <Radio 
            bind:group={imageFormat} 
            value="png" 
            >PNG</Radio>
          <Radio 
            bind:group={imageFormat} 
            value="svg"
            >SVG</Radio>
        </div>
      </div>

      <div class="mb-3">
          <Label class="mb-2">Output filename</Label>
          <div class="flex">
              <Input 
              type="text" 
              bind:value={filename}
              size="sm"
              class="flex-grow"
              />
          </div>
      </div>

      {#if imageFormat === 'png'}
        <div class="mb-3">
          <Label class="mb-2">Background</Label>
          <div class="flex gap-4">
            <Radio 
              bind:group={isTransparent} 
              value={true}
              >Transparent</Radio>
            <Radio 
              bind:group={isTransparent} 
              value={false}
              >White</Radio>
          </div>
        </div>
      {/if}
    </div>

    <div style="display: flex; flex-direction: column;">
      {#if imageFormat === 'png'}
        <div class="mb-2">
          <Label class="mb-2">Size</Label>
          <div class="flex gap-4">
            <Radio 
              bind:group={sizeMode} 
              value="auto"
              >Auto</Radio>
            <Radio 
              bind:group={sizeMode} 
              value="width"
              >Width</Radio>
            <Radio 
              bind:group={sizeMode} 
              value="height"
              >Height</Radio>
          </div>
        </div>

        {#if sizeMode !== 'auto'}
          <div class="mb-3">
            <Label class="mb-2">Size (pixels)</Label>
            <Input 
              type="number" 
              bind:value={customSize}
              min="100"
              max="10000"
              size="sm"
            />
          </div>
        {/if}
      {/if}
    </div>
  </div>

  <div class="mb-5 flex gap-2" style="display: flex; flex-direction: column; align-content: flex-end; flex-wrap: wrap;">

    <Button 
      size="xs"
      color="light"
      on:click={copyToClipboard}
    >
      <FileCopySolid class="w-4 h-4 me-2" />{copyStatus || 'Copy to Clipboard'}
    </Button>

    <Button 
      size="xs"
      color="light"
      on:click={showPreview}
    >
      <WindowSolid class="w-4 h-4 me-2" />Preview in New Tab
    </Button>

    <Button 
        size="sm"
        on:click={exportDiagram}
    >
        <DownloadSolid class="w-4 h-4 me-2" />Export Sequence to {imageFormat == 'png' ? 'PNG' : 'SVG'} file
    </Button>
  </div>
</div>