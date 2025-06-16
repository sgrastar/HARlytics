<script>
  import { onMount } from "svelte";
import * as d3 from "d3";

export let data;
export let width = 350;
export let height = 300;
export let innerRadius = 0;
export let outerRadius = Math.min(width, height) / 2 - 20;
//export let colorScheme = d3.schemePaired;

let chartElement;
let arcs = [];

function createChart() {
  const isDark = document.documentElement.classList.contains('dark');

  const colorScheme = isDark 
    ? d3.schemeSet2.map(color => d3.rgb(color).darker(0.3).toString())
    : d3.schemeSet2;

  const textColor = isDark ? '#e5e7eb' : '#333';
  
  // Background color
  const backgroundColor = isDark ? '#1f2937' : '#ffffff';

  const pie = d3
    .pie()
    .value((d) => d.value)
    .sort(null);

  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

  const labelArc = d3
    .arc()
    .innerRadius(outerRadius * 0.9)
    .outerRadius(outerRadius * 0.9);

  const color = d3.scaleOrdinal(colorScheme);

  // Apply new data
  arcs = pie(data);

  // Select and update pie chart paths (with transition)
  d3.select(chartElement)
    .selectAll("path")
    .data(arcs)
    .join(
      enter => enter.append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => color(i))
        .attr("stroke", "white")
        .style("stroke-width", "2px"),
      update => update
        .transition()
        .duration(750)
        .attrTween("d", function(d) {
          const interpolate = d3.interpolate(this._current || d, d);
          this._current = interpolate(0);
          return function(t) {
            return arc(interpolate(t));
          };
        })
    );

  // Select and update labels (with transition)
  const labels = d3
    .select(chartElement)
    .selectAll("text")
    .data(arcs.filter((d) => d.value > 0))
    .join(
      enter => enter.append("text")
        .style('fill', textColor)
        .attr("dy", ".35em")
        .style("text-anchor", function (d) {
          var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
          return midangle < Math.PI ? "start" : "end";
        })
        .text(function (d) {
          const total = d3.sum(data, (d) => d.value);
          const percent = Math.round((1000 * d.data.value) / total) / 10;
          return `${d.data.name} (${percent}%)`;
        })
        .attr("opacity", 0),
      update => update
        .transition()
        .duration(750)
        .text(function (d) {
          const total = d3.sum(data, (d) => d.value);
          const percent = Math.round((1000 * d.data.value) / total) / 10;
          return `${d.data.name} (${percent}%)`;
        })
    );

  // Select and update polylines (with transition)
  d3.select(chartElement)
    .selectAll("polyline")
    .data(arcs.filter((d) => d.value > 0))
    .join(
      enter => enter.append("polyline")
        .attr("stroke", isDark ? '#eeeeee' : '#1f2937')
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr("opacity", 0),
      update => update
        .transition()
        .duration(750)
    );

  // Collision avoidance for label positioning + display area limits
  const labelPositions = [];
  labels.each(function(d) {
    let pos = labelArc.centroid(d);
    let midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
    pos[0] = outerRadius * 0.99 * (midangle < Math.PI ? 1 : -1);

    // Collision detection and position adjustment
    for (let i = 0; i < labelPositions.length; i++) {
      const other = labelPositions[i];
      if (Math.abs(pos[1] - other[1]) < 14) {
        // If too close
        pos[1] = other[1] + 14 * (pos[1] > other[1] ? 1 : -1); // Shift vertically
      }
    }
    labelPositions.push(pos);

    // Display area limits (adjust x coordinate to stay within bounds)
    if (pos[0] > width / 2 - 20) {
      pos[0] = width / 2 - 20; // Adjust to fit right edge
    } else if (pos[0] < -(width / 2 - 20)) {
      pos[0] = -(width / 2 - 20); // Adjust to fit left edge
    }

    // Update position with transition
    d3.select(this)
      .transition()
      .duration(750)
      .attr("transform", "translate(" + pos + ")")
      .attr("opacity", 1);
  });
  
  // Update polyline positions (with transition)
  d3.select(chartElement)
    .selectAll("polyline")
    .each(function(d, i) {
      const pos = labelPositions[i] || labelArc.centroid(d);
      const posA = arc.centroid(d);
      const posB = labelArc.centroid(d);
      const posC = [pos[0], pos[1]];
      
      d3.select(this)
        .transition()
        .duration(750)
        .attr("points", [posA, posB, posC])
        .attr("opacity", 1);
    });

  // Save current state to each element on initialization
  d3.select(chartElement).selectAll("path").each(function(d) {
    this._current = d;
  });
}

onMount(() => {
  createChart();
});

$: {
  if (data) {
    createChart();
  }
}
</script>

<div class="chart-container">
  <svg bind:this={chartElement} {width} {height} viewBox="-175 -115 350 230">
    <g transform="translate({width / 2}, {height / 2})"></g>
  </svg>
</div>

<style>
  :global(.chart-container) {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
