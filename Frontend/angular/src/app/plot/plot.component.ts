// @ts-nocheck
import { Component, Input, Output, EventEmitter } from '@angular/core'
import * as d3 from 'd3'

@Component({
  selector: 'app-plot',
  templateUrl: './plot.component.html',
  styleUrls: ['./plot.component.css']
})

export class PlotComponent {
  @Input() data = [] // Data and metadata which is used to create the scatterplot
  @Input() settings = [{}, 0]
  @Output() selectedHighlight = new EventEmitter<any>() // A selection of all the points included in the drawn rectangle

  ngOnChanges() {
    // Clear previous plot
    $('plot1').innerHTML = ''
    $('histogram1').innerHTML = ''
    var settings = this.settings
    var data = this.data.provinces
    var domain0 = this.data.domain0
    var domain1 = this.data.domain1
    var color0 = this.data.color0
    var color1 = this.data.color1
    var regression1 = this.data.regression1
    var variables = this.data.variables
    var selectedHighlight = this.selectedHighlight
    if (variables && variables.length > 2) radviz(data, variables)

    /* The functions addNormalizedValues(), RVradviz(), calculateNodePosition() and corresponding formulas are taken from https://github.com/WYanChao/RadViz and were originally written by Wang Yan Chao at the Nanyang Technological University, and modified for this purpose. This creates a RadViz of all selected variables, if there are over 2 of them. */

    function radviz(DATA, variables) {
      var DOMRadViz = d3.select('#plot1')
      var DOMHistogram = d3.select('#histogram1')
      var radiusDA = 5, // radius of the data points
        radiusDT = 3 // radius of the anchor points
      var margin = { top: 30, right: 180, bottom: 30, left: 180 },
        width = 600,
        height = 300
      var chartRadius = Math.min((height - margin.top - margin.bottom), (width - margin.left - margin.right)) / 2
      var dimensions = variables
      var DAnchor = calculateAnchorPositions(dimensions)
      let Histmargin = { top: 20, right: 20, bottom: 30, left: 30 },
        Histwidth = 600,
        Histheight = 300
      let binnumber = 50 // default value
      const brush = d3.brushX() // define a brush
      var x = d3.scaleLinear().range([0, (Histwidth - Histmargin.left - Histmargin.right)]),
        x_t = d3.scaleLinear().domain([0, 1]).range([0, (Histwidth - Histmargin.left - Histmargin.right)]),
        y = d3.scaleLinear().rangeRound([Histheight - Histmargin.top - Histmargin.bottom, 0]),
        xdelta = 1 / binnumber

      function calculateAnchorPositions(dimensions) {
        var anchors = [], parties = []
        var startingParty, startingPartyAnchor, nonPartyDimensions = [], order = []
        for (var i = 0; i < dimensions.length; i++) {
          // The parties will get a predefined location on the radviz to match their semantic color
          switch (dimensions[i]) {
            case 'AFD':
              startingPartyAnchor = anchors[i] = Math.PI * ((275 / 180) + 1)
              startingParty = 'AFD'
              parties.push({ name: 'AFD', pos: Math.PI * ((275 / 180) + 1) })
              break
            case 'FDP':
              startingPartyAnchor = anchors[i] = Math.PI * ((82.5 / 180) + 1)
              startingParty = 'FDP'
              parties.push({ name: 'FDP', pos: Math.PI * ((82.5 / 180) + 1) })
              break
            case 'Grüne':
              startingPartyAnchor = anchors[i] = Math.PI * ((125 / 180) + 1)
              startingParty = 'Grüne'
              parties.push({ name: 'Grüne', pos: Math.PI * ((125 / 180) + 1) })
              break
            case 'SPD':
              startingPartyAnchor = anchors[i] = Math.PI * ((37.5 / 180) + 1)
              startingParty = 'SPD'
              parties.push({ name: 'SPD', pos: Math.PI * ((37.5 / 180) + 1) })
              break
            case 'Linke':
              startingPartyAnchor = anchors[i] = Math.PI * ((350 / 180) + 1)
              startingParty = 'Linke'
              parties.push({ name: 'Linke', pos: Math.PI * ((350 / 180) + 1) })
              break
            case 'Union':
              startingPartyAnchor = anchors[i] = Math.PI * ((200 / 180) + 1)
              startingParty = 'Union'
              parties.push({ name: 'Union', pos: Math.PI * ((200 / 180) + 1) })
              break
            default:
              anchors[i] = i * 2 * Math.PI / (dimensions.length)
              nonPartyDimensions.push(dimensions[i])
              order[i] = dimensions[i]
              break
          }
        }
        // If only parties are chosen, we know their colors and do not need to make any adjustments
        if (nonPartyDimensions.length == 0) return anchors
        /* If a mix of more than one party and structural data is chosen, it is not possible to use the correlation-based spacings, thus we optimize for the distance between variables to enhance contrast. */
        if (nonPartyDimensions.length > 0 && dimensions.length - nonPartyDimensions.length > 1) {
          var partiesOriginalOrder = [...parties]
          parties.forEach((e) => e.pos = e.pos % (Math.PI * 2))
          parties.sort((a, b) => a.pos - b.pos)
          var sectionCount = 1
          var spaces = [{ startName: parties[parties.length - 1].name, start: parties[parties.length - 1].pos, length: parties[0].pos - parties[parties.length - 1].pos + Math.PI * 2, sections: 1 }]
          for (var i = 1; i < parties.length; i++) {
            spaces.push({ startName: parties[i - 1].name, start: parties[i - 1].pos, length: parties[i].pos - parties[i - 1].pos, sections: 1 })
            sectionCount++
          }
          while (sectionCount < variables.length) {
            spaces.sort((a, b) => b.length - a.length)
            spaces[0].length *= spaces[0].sections / (spaces[0].sections + 1)
            spaces[0].sections++
            sectionCount++
          }
          var finalOrder = []
          var x = 0
          for (var party of partiesOriginalOrder) {
            for (var space of spaces) {
              if (space.startName == party.name) {
                finalOrder.push({ name: party.name, pos: party.pos })
                for (var i = 1; i < space.sections; i++) {
                  finalOrder.push({ name: nonPartyDimensions[x], pos: space.start + i * space.length })
                  x++
                }
              }
            }
          }
          var fixedAnchors = []
          for (var variable of variables) {
            for (var finalVar of finalOrder) {
              if (variable == finalVar.name) {
                fixedAnchors.push(finalVar.pos)
              }
            }
          }
          return fixedAnchors
        }

        // If we have less than two parties and structural data, we choose the color spacing based on correlation
        order = []
        var currentDim, noParties
        /* Using a greedy algorithm, we pick the first variable as a pivot and calculate the similarity of all other variables. Then we take the variable which was most similar, place it next to the first variable, and calculate the similarity of all remaining variables using it as the next pivot. Until only one variable remains. */
        if (startingParty) {
          order.push({ d: startingParty })
          currentDim = startingParty
        } else {
          currentDim = nonPartyDimensions[0]
          order.push({ d: nonPartyDimensions[0] })
          noParties = nonPartyDimensions[0]
          nonPartyDimensions = nonPartyDimensions.filter(item => item !== currentDim)
        }

        while (nonPartyDimensions.length > 0) {
          var maxCorr = 2.0, maxCorrDim


          // This returns the Pearson correlation coefficient which we will use as a similarity measure, e.g. https://en.wikipedia.org/wiki/Pearson_correlation_coefficient#Definition
          function calcCorr(d0, d1) {
            var meanx = 0, meany = 0, x = 0, y = 0

            for (var province of data) {
              if (_(province)[d0]) {
                x++
                meanx += +_(province)[d0]
              }
              if (_(province)[d1]) {
                y++
                meany += +_(province)[d1]
              }
            }

            meanx /= x
            meany /= y

            var sum0 = 0, sum1 = 0, sum2 = 0

            for (var province of data) {
              if (_(province)[d0] && _(province)[d1]) {
                sum0 += (_(province)[d0] - meanx) * (_(province)[d1] - meany)
                sum1 += (_(province)[d0] - meanx) * (_(province)[d0] - meanx)
                sum2 += (_(province)[d1] - meany) * (_(province)[d1] - meany)
              }
            }
            return (1 - sum0 / (Math.sqrt(sum1) * Math.sqrt(sum2))) || 0
          }

          // Find out what variable correlates the most with the first one
          for (var dim of nonPartyDimensions) {
            var correlation = calcCorr(currentDim, dim)

            if (correlation <= maxCorr) {
              maxCorr = correlation
              maxCorrDim = dim
            }
          }
          currentDim = maxCorrDim

          // We always use the selected party as the first element in the order, even if the user chose another variable first.
          if (nonPartyDimensions.length == 1) {
            for (var i = 0; i < order.length; i++) {
              if (order[i].d == startingParty) {
                order.splice(i, 1)
                order.splice(0, 0, { d: startingParty, c: calcCorr(currentDim, startingParty) })
              }
            }
            if (noParties) {
              order[0].c = calcCorr(currentDim, noParties)
            }
          }
          nonPartyDimensions = nonPartyDimensions.filter(item => item !== maxCorrDim)
          order.push({ d: maxCorrDim, c: maxCorr })
        }

        // When we found the correct order, we sum over all the correlations
        var correlationSum = 0

        for (var variable in order) {
          correlationSum += order[variable].c
        }

        if (startingParty) {
          dimensions[0] = startingParty
          anchors[0] = startingPartyAnchor
        }
        // Here we determine the percentage of 1 - correlation which will be used as the distance between the anchors
        var previousRadSum = 0
        for (var i = 1; i < order.length; i++) {
          anchors[i] = 2 * Math.PI * order[i].c / correlationSum + (startingPartyAnchor || 0) + previousRadSum
          previousRadSum += 2 * Math.PI * order[i].c / correlationSum
          dimensions[i] = order[i].d
        }
        return anchors
      }

      var normalizeSuffix = '_normalized'
      var dimensionNamesNormalized = dimensions.map(d => d + normalizeSuffix)
      var DA = DAnchor.slice()
      var dataE = Array.prototype.slice.call(DATA)

      dataE.forEach((d, i) => {
        _(d).index = i
        _(d).id = i
      })

      dataE.forEach((d, i) => {
        _(d).index = i
        _(d).id = i
      })

      dataE = addNormalizedValues(dataE)
      dataE = calculateNodePosition(dataE, dimensionNamesNormalized, DA)

      // x,y-Position of the anchors
      var DAdata = dimensions.map(function (d, i) {
        return {
          theta: DA[i], //[0, 2*PI]
          x: Math.cos(DA[i]) * chartRadius + chartRadius,
          y: Math.sin(DA[i]) * chartRadius + chartRadius,
          fixed: true,
          name: d
        }
      })
      let Histdata = []
      Histdata = initializeHistData(dataE, binnumber)

      // Normalize data points to [0,1]
      function addNormalizedValues(data) {
        data.forEach(function (d) {
          dimensions.forEach(function (dimension) {
            _(d)[dimension] = +_(d)[dimension]
          })
        })

        var normalizationScales = {}
        dimensions.forEach(function (dimension) {
          normalizationScales[dimension] = d3.scaleLinear().domain(d3.extent(data.map((d) => _(d)[dimension]))).range([0.1, 0.9])
        })

        data.forEach(function (d) {
          dimensions.forEach(function (dimension) {
            _(d)[dimension + '_normalized'] = normalizationScales[dimension](_(d)[dimension])
          })
        })

        data.forEach(function (d) {
          var dsum = 0
          dimensionNamesNormalized.forEach((k) => dsum += _(d)[k])
          _(d).dsum = dsum
        })

        return data
      }

      // x,y-Position based off of the anchors
      function calculateNodePosition(dataE, dimensionNamesNormalized, DA) {
        dataE.forEach(function (d) {
          var dsum = _(d).dsum, dx = 0, dy = 0
          dimensionNamesNormalized.forEach(function (k, i) {
            dx += Math.cos(DA[i]) * _(d)[k]
            dy += Math.sin(DA[i]) * _(d)[k]
          }) // dx & dy
          _(d).x0 = dx / dsum
          _(d).y0 = dy / dsum
          _(d).dist = Math.sqrt(Math.pow(dx / dsum, 2) + Math.pow(dy / dsum, 2)) // calculate r
          _(d).distH = Math.sqrt(Math.pow(dx / dsum, 2) + Math.pow(dy / dsum, 2)) // calculate r
          _(d).theta = Math.atan2(dy / dsum, dx / dsum) * 180 / Math.PI
          _(d).color = d3.hcl(_(d).theta + 180, _(d).distH * 230, settings[0].lightness ? 89 - 80 * _(d).dsum / dimensions.length : 55)
          d.setAttribute('style', 'fill: ' + d3.hcl(_(d).theta + 180, _(d).distH * 230, settings[0].lightness ? 89 - 80 * _(d).dsum / dimensions.length : 55).formatRgb())
        })
        return dataE
      }

      var svg = DOMRadViz.append('svg').attr('id', 'radviz')
        .attr('width', width)
        .attr('height', height)
      svg.append('rect').attr('fill', 'transparent')
        .attr('width', width)
        .attr('height', height)
      // transform a distance.(can treat as margin)
      var center = svg.append('g').attr('class', 'center').attr('transform', `translate(${margin.left},${margin.top})`)
      const histogram = d3.select('#histogram1')
      histogram.append('svg').attr('id', 'histogram')


      var PVRadviz = d3.select(DOMRadViz).data([PVradviz()])
      const PVHistogram = d3.select('#histogram1').data([pvhistogram()])
      PVRadviz.each(render)
      PVHistogram.each(render)
      function render(method) {
        d3.select(this).call(method)
      }

      function PVradviz() {

        function chart(div) {
          div.each(function () {

            /*Draw the big circle: drawPanel(chartRadius)*/
            drawPanel(chartRadius)

            /*Draw the Dimensional Anchor nodes: tips components, and then call drawDA() to draw DA points, and call drawDALabel to draw DA labels*/
            drawDA()// draw the DA nodes
            drawDALabel()// the DA nodes label

            // plot each data node
            drawDT()

            // subfunction --> drawPanel(a): draw the big circle with the radius 'a'
            function drawPanel(a) {
              var panel = center.append('circle')
                .attr('class', 'big-circle')
                .attr('stroke', d3.rgb(0, 0, 0))
                .attr('stroke-width', 3)
                .attr('fill', 'transparent')
                .attr('r', a)
                .attr('cx', a)
                .attr('cy', a)
            }

            // subfunction --> drawDA(): draw the DA
            function drawDA() {
              center.selectAll('circle.DA-node').remove()
              var DANodes = center.selectAll('circle.DA-node')
                .data(DAdata)
                .enter().append('circle').attr('class', 'DA-node')
                .attr('fill', d => d3.hcl(180 * (1 + d.theta / Math.PI), 230, 55))
                .attr('stroke', d3.rgb(120, 120, 120))
                .attr('stroke-width', 1)
                .attr('r', radiusDA)
                .attr('cx', d => d.x)
                .attr('cy', d => d.y)
            }


            // subfunction --> drawDALabel(): draw the dimensional anchor label.
            function drawDALabel() {
              center.selectAll('text.DA-label').remove()
              var DANodesLabel = center.selectAll('text.DA-label')
                .data(DAdata).enter().append('text').attr('class', 'DA-label')
                .attr('x', d => d.x).attr('y', d => d.y)
                .attr('fill', 'black')
                .attr('text-anchor', d => Math.cos(d.theta) > 0 ? 'start' : 'end')
                .attr('dx', d => Math.cos(d.theta) * 15)
                .attr('dy', d => Math.sin(d.theta) < 0 ? Math.sin(d.theta) * (15) : Math.sin(d.theta) * (15) + 10)
                .text(d => getText(d.name))
                .attr('font-size', '10pt')
            }


            // subfunction --> drawDT(): draw the data points.
            function drawDT() {
              center.selectAll('.circle-data').remove()
              var DTNodes = center.selectAll('.circle-data')
                .data(dataE).enter().append('circle').attr('class', 'circle-data')
                .attr('id', d => d.index)
                .attr('r', radiusDT)
                .attr('fill', d => _(d).color)
                .attr('stroke', 'black')
                .attr('stroke-width', 0.25)
                .attr('wkr_nr', d => _(d).wkr_nr)
                .attr('cx', d => _(d).x0 * chartRadius + chartRadius || 0)
                .attr('cy', d => _(d).y0 * chartRadius + chartRadius || 0)
            }
          })
        }
        return chart
      }

      function pvhistogram() {
        function histogram() { }
        if (settings[0].saturation)
          var intervalID = setInterval(myCallback, 10, settings[0].intensity / 100, settings[0].tolerance, 0.015, 0.99)

        function myCallback(radius, limit, add, mult) {
          var count = 0
          dataE.forEach((d, i) => {
            if (_(d).distH < radius) {
              count++
            }
          })
          if (count <= limit)
            clearInterval(intervalID)
          dataE.forEach((d, i) => {
            _(d).distH = Math.min((((_(d).distH + add) * mult)), 1)
            _(d).x0 = Math.cos(_(d).theta * Math.PI / 180) * _(d).distH
            _(d).y0 = Math.sin(_(d).theta * Math.PI / 180) * _(d).distH
          })
          let tempc = d3.selectAll('circle.circle-data')
          tempc.attr('cx', d => _(d).x0 * chartRadius + chartRadius)
            .attr('cy', d => _(d).y0 * chartRadius + chartRadius)
            .attr('fill', d => d3.hcl(_(d).theta + 180, _(d).distH * 230, settings[0].lightness ? 89 - 80 * _(d).dsum / dimensions.length : 55).formatRgb())
          dataE.forEach(function (d) {
            _(d).color = d3.hcl(_(d).theta + 180, _(d).distH * 230, settings[0].lightness ? 89 - 80 * _(d).dsum / dimensions.length : 55)
            d.setAttribute('style', 'fill: ' + _(d).color.formatRgb())
          })
        }
        return histogram
      }

      function initializeHistData(dataE, number) {
        let data = [...Array.apply(null, { length: number }).map(Number.call, Number)].map(e => Array.apply(null, { length: variables.length + 1 }).fill(0))
        data.forEach((d, i) => { d[0] = i }) // add index
        let tempa = d3.scaleLinear().domain([0, 1]).range([0, data.length])
        //console.log('test v2:', keys);
        dataE.forEach((d) => {
          let tempb = Math.floor(tempa(d.distH)) == number ? number - 1 : Math.floor(tempa(d.distH))
          let tempc = 0
          //++data[tempb][tempc+1];
          d.histindex = tempb//to update the radviz in brush
        }) // add values
        let keys = variables.slice()
        data = data.map(function (d) {
          let tempa = {}
          keys.forEach(function (k, i) {
            tempa[k] = d[i]
          })
          return tempa
        })
        data.forEach((d) => {
          let tempd = 0
          keys.forEach((k, i) => { tempd += d[k] })
          d.total = tempd
        })
        return data
      }

      // Enables drawing rectangles in the radviz  to select data points
      var circles = $c('circle-data')
      svg.call(d3.brush()
        .extent([[0, 0], [width, height]])
        .on('end', (e) => {
          var selectedArray = []
          for (var circle of circles) {
            if (isBrushed(e.selection, circle.cx.baseVal.value, circle.cy.baseVal.value)) {
              circle.setAttribute('stroke-width', '2')
              selectedArray.push(circle.getAttribute('wkr_nr'))
            } else {
              circle.setAttribute('stroke-width', '0.25')
            }

            function isBrushed(brush_coords, cx, cy) {
              if (brush_coords) {
                var x0 = brush_coords[0][0] - 180,
                  x1 = brush_coords[1][0] - 180,
                  y0 = brush_coords[0][1] - 30,
                  y1 = brush_coords[1][1] - 30
                return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1
              }
              return false
            }
          }
          selectedHighlight.emit(selectedArray)
        })
      )
    }
    // Creates a scatter plot of variables 0 and 1.
    if (variables && variables.length == 2) {
      // Clear existing plots
      $('chart')?.remove()

      var w = 550
      var h = 350
      var padding = 65

      var svg = d3.select('#plot1')
        .append('svg')
        .attr('width', w)
        .attr('height', h)
        .attr('id', 'chart')

      var xScale = d3.scaleLinear()
        .domain(domain0)
        .range([padding, w - padding])

      var yScale = d3.scaleLinear()
        .domain(domain1)
        .range([h - padding, padding])

      // Add data points
      svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(_(d)[variables[0]]))
        .attr('cy', d => yScale(parseFloat(_(d)[variables[1]])))
        .attr('data-xvalue', d => _(d)[variables[0]])
        .attr('data-yvalue', d => _(d)[variables[1]])
        .attr('wkr_nr', d => _(d).wkr_nr)
        .attr('stroke', 'black')
        .attr('stroke-width', '0.25')
        .attr('r', 3)
        .attr('fill', d => _(d).plotColor)

      // Add axis
      var xAxis = d3.axisBottom(xScale)
      var yAxis = d3.axisLeft(yScale)

      svg.append('g')
        .attr('transform', 'translate( 0,' + (h - padding) + ')')
        .attr('id', 'x-axis')
        .call(xAxis).selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(45)")
        .style("text-anchor", "start")

      svg.append('g')
        .attr('transform', 'translate( ' + padding + ', 0) ')
        .attr('id', 'y-axis')
        .call(yAxis)

      // Add legend
      svg.append('circle')
        .attr('cx', (padding))
        .attr('cy', (h - padding + 50))
        .attr('r', 6)
        .attr('fill', this.data.abs ? color1 : 'red')

      svg.append('circle')
        .attr('cx', (w - padding + 10))
        .attr('cy', (h - padding + 50))
        .attr('r', 6)
        .attr('fill', this.data.abs ? color0 : 'blue')

      svg.append('text')
        .attr('x', (padding + 10))
        .attr('y', (h - padding + 55))
        .text(this.data.abs ? getText(variables[1]) : 'More ' + getText(variables[0]) + ' than exp.')
        .style('fill', 'black')

      svg.append('text')
        .attr('x', (w - padding))
        .attr('text-anchor', 'end')
        .attr('y', (h - padding + 55))
        .text(this.data.abs ? getText(variables[0]) : 'Less ' + getText(variables[0]) + ' than exp.')
        .style('fill', 'black')

      // Add regression line
      svg.append('line')
        .attr('x1', xScale(domain0[0]))
        .attr('y1', yScale(domain0[0] * regression1[0] + regression1[1]))
        .attr('x2', xScale(domain0[1]))
        .attr('y2', yScale(domain0[1] * regression1[0] + regression1[1]))
        .attr('stroke', 'black')
        .attr('opacity', '0.8')
        .attr('stroke-width', '2px')
        .attr('stroke-dasharray', '3, 2')

      // Enables drawing rectangles in the scatter plot to select data points
      var circles = $c('dot')
      svg.call(d3.brush()
        .extent([[0, 0], [w, h]])
        .on('end', (e) => {
          var selectedArray = []
          for (var circle of circles) {
            if (isBrushed(e.selection, circle.cx.baseVal.value, circle.cy.baseVal.value)) {
              circle.setAttribute('stroke-width', '2')
              selectedArray.push(circle.getAttribute('wkr_nr'))
            } else {
              circle.setAttribute('stroke-width', '0.25')
            }

            function isBrushed(brush_coords, cx, cy) {
              if (brush_coords) {
                var x0 = brush_coords[0][0],
                  x1 = brush_coords[1][0],
                  y0 = brush_coords[0][1],
                  y1 = brush_coords[1][1]
                return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1
              }
              return false
            }
          }
          this.selectedHighlight.emit(selectedArray)
        })
      )
    }
  }
}

