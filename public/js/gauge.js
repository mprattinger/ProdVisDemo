/*global d3*/

class Gauge {
  constructor(container, configuration) {
    this.config = {
      size: 200,
      clipWidth: 200,
      clipHeight: 110,
      ringInset: 20,
      ringWidth: 20,

      pointerWidth: 10,
      pointerTailLength: 5,
      pointerHeadLengthPercent: 0.9,

      minValue: 0,
      maxValue: 10,

      minAngle: -90,
      maxAngle: 90,

      transitionMs: 750,

      majorTicks: 5,
      labelFormat: d3.format(",g"),
      labelInset: 10,

      arcColorFn: d3.interpolateHsl(d3.rgb("#e8e2ca"), d3.rgb("#3e6c0a"))
    };

    this.range = undefined;
    this.r = undefined;
    this.pointerHeadLength = undefined;
    this.value = 0;

    this.svg = undefined;
    this.arc = undefined;
    this.scale = undefined;
    this.ticks = undefined;
    this.tickData = undefined;
    this.pointer = undefined;

    this.donut = d3.layout.pie();

    this.configure(configuration);
  }

  configure(configuration) {
    for (const prop in configuration) {
      this.config[prop] = configuration[prop];
    }

    this.range = this.config.maxAngle - this.config.minAngle;
    this.r = this.config.size / 2;
    this.pointerHeadLength = Math.round(
      this.r * this.config.pointerHeadLengthPercent
    );

    this.scale = d3.scale
      .linear()
      .range([0, 1])
      .domain([this.config.minValue, this.config.maxValue]);

    this.ticks = this.scale.ticks(this.config.majorTicks);
    this.tickData = d3.range(this.config.majorTicks).map(() => {
      return 1 / this.config.majorTicks;
    });

    this.arc = d3.svg
      .arc()
      .innerRadius(this.r - this.config.ringWidth - this.config.ringInset)
      .outerRadius(this.r - this.config.ringInset)
      .startAngle(function(d, i) {
        const ratio = d * i;
        return this.deg2rad(this.config.minAngle + ratio * this.range);
      })
      .endAngle(function(d, i) {
        const ratio = d * (i + 1);
        return this.deg2rad(this.config.minAngle + ratio * this.range);
      });
  }

  render(newValue) {
    this.svg = d3
      .select(this.container)
      .append("svg:svg")
      .attr("class", "gauge")
      .attr("width", this.config.clipWidth)
      .attr("height", this.config.clipHeight);

    const centerTx = this.centerTranslation();

    const arcs = this.svg
      .append("g")
      .attr("class", "arc")
      .attr("transform", centerTx);

    arcs
      .selectAll("path")
      .data(this.tickData)
      .enter()
      .append("path")
      .attr("fill", (d, i) => {
        return this.config.arcColorFn(d * i);
      })
      .attr("d", this.arc);

    const lg = this.svg
      .append("g")
      .attr("class", "label")
      .attr("transform", centerTx);
    lg.selectAll("text")
      .data(this.ticks)
      .enter()
      .append("text")
      .attr("transform", d => {
        const ratio = this.scale(d);
        const newAngle = this.config.minAngle + ratio * this.range;
        return (
          "rotate(" +
          newAngle +
          ") translate(0," +
          (this.config.labelInset - this.r) +
          ")"
        );
      })
      .text(this.config.labelFormat);

    const lineData = [
      [this.config.pointerWidth / 2, 0],
      [0, -this.pointerHeadLength],
      [-(this.config.pointerWidth / 2), 0],
      [0, this.config.pointerTailLength],
      [this.config.pointerWidth / 2, 0]
    ];
    const pointerLine = d3.svg.line().interpolate("monotone");
    const pg = this.svg
      .append("g")
      .data([lineData])
      .attr("class", "pointer")
      .attr("transform", centerTx);

    this.pointer = pg
      .append("path")
      .attr("d", pointerLine /*function(d) { return pointerLine(d) +'Z';}*/)
      .attr("transform", "rotate(" + this.config.minAngle + ")");

    this.update(newValue === undefined ? 0 : newValue);
  }

  update(newValue, newConfiguration) {
    if (newConfiguration !== undefined) {
      this.configure(newConfiguration);
    }
    const ratio = this.scale(newValue);
    const newAngle = this.config.minAngle + ratio * this.range;
    this.pointer
      .transition()
      .duration(this.config.transitionMs)
      .ease("elastic")
      .attr("transform", "rotate(" + newAngle + ")");
  }

  centerTranslation() {
    return "translate(" + this.r + "," + this.r + ")";
  }

  isRendered() {
    return this.svg !== undefined;
  }

  deg2rad(deg) {
    return (deg * Math.PI) / 180;
  }

  newAngle(d) {
    const ratio = this.scale(d);
    const newAngle = this.config.minAngle + ratio * this.range;
    return newAngle;
  }
}
