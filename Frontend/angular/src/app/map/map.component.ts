// @ts-nocheck
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core'
import * as d3 from 'd3'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})

export class MapComponent implements OnInit {
  @Input() selectedDataset = [] // Changes by selecting different variables in the dropdown menus
  @Input() highlight = [] // Changes by selecting data points in the scatter plot
  @Input() anaType = [] // Absolute ([]) or correlation-based ([1]) visualization type
  @Input() settings = [{}, 0] // Settings
  @Output() variables = new EventEmitter<any>() // All variables that can be visualized
  @Output() ready = new EventEmitter<any>() // When the map is done loading
  @Output() plotData = new EventEmitter<any>() // Data of selected variables for all provinces

  ngOnChanges(changes) {
    if (changes['selectedDataset'] && changes['selectedDataset'].previousValue != changes['selectedDataset'].currentValue) {
      this.selectData()
      localStorage.setItem("variables", this.selectedDataset)
    }

    if (changes['highlight'] && changes['highlight'].previousValue != changes['highlight'].currentValue) {
      this.highlightProvinces()
    }

    if (changes['anaType'] && changes['anaType'].previousValue != changes['anaType'].currentValue) {
      this.selectData()
    }
    if (changes['settings']) {
      if (this.settings[0].tooltips)
        $('bar').style.display = "block"
      else
        $('bar').style.display = "none"

    }
  }

  // Hides all non-brushed data points in the plots, if there is a selection
  highlightProvinces() {
    if (this.highlight.length == 0) {
      d3.selectAll('.provinceElement').style('opacity', 1)
    } else {
      d3.selectAll('.provinceElement').style('opacity', d => { return this.highlight.includes(d.properties.wkr_nr) ? 1 : 0 })
    }
  }

  selectData() {
    // We use semantic coloring for german parties and assign turquoise to the 'Union' as black does not work well when combined. Analyzing only CDU or CSU will be possible, but they are not treated as a party in that sense, thus getting a well contrasting color instead of a predefined one.
    var partycolors = new Map()
    partycolors.set('SPD', 'rgb(255,0,0)')
    partycolors.set('FDP', 'rgb(200,200,0)')
    partycolors.set('Grüne', 'rgb(0,255,0)')
    partycolors.set('AFD', 'rgb(55,0,255)')
    partycolors.set('Linke', 'rgb(255,0,255)')
    partycolors.set('Union', 'rgb(0,200,255)')
    var provinces = $c('provinceElement')



    // Get relevant variables, calculate their ranges, colors, regressions and deviation from them
    var variables = this.selectedDataset
    var dim0, dim1, color0, color1, mix0, mix1, domain0, domain1, regression1, maxDev1

    if (variables.length != 0 && variables.length < 3) {
      dim0 = variables[0]
      // When visualizing only one variable, parties get their color and everything else gets blue
      color0 = partycolors.get(variables[0]) || 'rgb(0,0,255)'
      domain0 = d3.extent(provinces, d => parseFloat(_(d)[variables[0]]))
    }

    if (variables.length == 2) {
      dim1 = variables[1]
      // When visualizing two variables, parties get their color and everything else gets a well-contrasting color
      color1 = partycolors.get(variables[1]) || this.colorToString(this.getColors(color0)[0])
      color0 = partycolors.get(variables[0]) || this.colorToString(this.getColors(color1)[1])
      domain1 = d3.extent(provinces, d => parseFloat(_(d)[dim1]))
      regression1 = this.regression(provinces, dim0, dim1)
      maxDev1 = this.maximumDeviation(provinces, regression1, dim0, dim1)
      // If we analyze two variables, we will add a scatterplot
    }

    if (variables.length > 2) {
      // If we analyze more than two variables, we will add a radviz, which will then also be responsible for the colors
      this.plotData.emit({ provinces, variables })
      return
    }
    this.plotData.emit({ provinces, variables })
    // This loop calculates the colors for every province based on the values of the selected variables.
    for (var province of provinces) {
      // For 2 variables: Switch between showing absolute values, mapping the length of the variable vector to opacity (% white), or showing deviation from expected regression value on a blue-white-red scale centered at white=0.
      if (this.anaType.length == 0 || variables.length != 2) {
        if (dim1) {
          if (_(province)[dim1]) {
            var scale = d3.scaleSequential()
              .domain(d3.extent(provinces, d => parseFloat(_(d)[dim1]))).range([0, 1])
            var intensity1 = scale(_(province)[dim1])
          } else {
            var intensity1 = 0
          }
        }

        if (dim0) {
          if (_(province)[dim0]) {
            var scale = d3.scaleSequential()
              .domain(d3.extent(provinces, d => parseFloat(_(d)[dim0]))).range([0, 1])

            var intensity0 = scale(_(province)[dim0])
          } else {
            var intensity0 = 0
          }
        }

        var finalcolor
        if (dim0 && !dim1) finalcolor = d3.interpolateRgb(color0, d3.color('rgba(0,0,0,0)'))(1 - (intensity0) / 2)
        else if (dim0 && dim1) {
          finalcolor = d3.interpolateRgb(color0, color1)(intensity1 / (intensity1 + intensity0))
          finalcolor = d3.interpolateRgb(finalcolor, d3.color('rgba(0,0,0,0)'))(1 - ((intensity0 + intensity1) / 2))
        }
        else if (!dim0 && dim1) finalcolor = finalcolor = d3.interpolateRgb(color1, d3.color('rgba(0,0,0,0)'))(1 - (intensity1) / 2)
        _(province).plotColor = finalcolor
        province.setAttribute('style', 'fill: ' + finalcolor)

      } else if (dim0) {

        if (dim1) {
          if (_(province)[dim1] && _(province)[dim0]) {
            var deviation = parseFloat(_(province)[dim1]) - (parseFloat(_(province)[dim0]) * regression1[0] + regression1[1])
            // Negative y-deviation is red since we have more of the first variable than we expected, while positive is blue.
            if (Math.sign(deviation) == -1) {
              var colorScale = d3.scaleSequential()
                .domain([Math.sign(maxDev1[0]) * maxDev1[0] * maxDev1[0], 0])
                .interpolator(d3.interpolate('red', d3.color('rgba(0, 0, 0, 0)')))

              mix1 = colorScale(Math.sign(deviation) * deviation * deviation)
            } else {
              var colorScale = d3.scaleSequential()
                .domain([0, Math.sign(maxDev1[1]) * maxDev1[1] * maxDev1[1]])
                .interpolator(d3.interpolate(d3.color('rgba(0, 0, 0, 0)'), 'blue'))

              mix1 = colorScale(deviation * deviation)
            }
            _(province).residual1 = deviation
          } else {
            mix1 = d3.color('rgba(0, 0, 0, 0)')
          }
        }

        if (dim0) {
          if (_(province)[dim0]) {
            var colorScale = d3
              .scaleSequential()
              .domain(domain0)
              .interpolator(d3.interpolate('white', color0))

            mix0 = colorScale(parseFloat(_(province)[dim0]))
          } else {
            mix0 = d3.color('rgba(0, 0, 0, 0)')
          }
        }

        var finalcolor

        if (dim0 && !dim1) finalcolor = mix0
        else if (dim0 && dim1) finalcolor = mix1
        _(province).plotColor = finalcolor
        province.setAttribute('style', 'fill: ' + finalcolor)
      }
    }
    if (variables.length == 2) {
      this.plotData.emit({ provinces, variables, domain0, domain1, regression1, maxDev1, color0, color1, abs: this.anaType.length == 0 })
    }
  }

  // Linear regression calculation (slope, intercept) - e.g. en.wikipedia.org/wiki/Simple_linear_regression
  regression(provinces, dim0, dim1) {
    var i = 0, xsum = 0, ysum = 0

    for (var province of provinces) {
      if (_(province)[dim0]) {
        i++
        xsum += parseFloat(_(province)[dim0])
        ysum += parseFloat(_(province)[dim1])
      }
    }

    var xavg = xsum / i
    var yavg = ysum / i
    var beta0, beta1
    var xyvar = 0
    var xvarstd = 0

    for (var province of provinces) {
      if (_(province)[dim0] && _(province)[dim1]) {
        xyvar += (parseFloat(_(province)[dim0]) - xavg) * ((parseFloat(_(province)[dim1])) - yavg)
        xvarstd += (parseFloat(_(province)[dim0]) - xavg) * (parseFloat(_(province)[dim0]) - xavg)
      }
    }

    beta1 = xyvar / xvarstd
    beta0 = yavg - (beta1 * xavg)

    return [beta1, beta0]
  }

  // Gets well-contrasting colors at +/-135° in both directions
  getColors(color) {
    if (!color) {
      return [[255, 0, 0], [0, 255, 0]]
    }

    var rgb = color.split('(')[1].split(')')[0].split(',')
    var temp = rgb[0]

    rgb[0] = rgb[1]
    rgb[1] = rgb[2]
    rgb[2] = temp

    var c1 = [...rgb]

    temp = rgb[0]
    rgb[0] = rgb[1]
    rgb[1] = rgb[2]
    rgb[2] = temp

    var c2 = [...rgb]
    return [c1, c2]
  }

  // [x,y,z] --> rgb(x,y,z)
  colorToString(rgb) {
    var result = 'rgb('
    result += rgb[0] + ', '
    result += rgb[1] + ', '
    result += rgb[2] + ')'
    return result
  }

  // Greatest difference, positive as well as negative, between actual and interpolated value
  maximumDeviation(provinces, regression, dim0, dim) {
    var min = Number.MAX_SAFE_INTEGER
    var max = Number.MIN_SAFE_INTEGER

    for (var province of provinces) {
      if (_(province)[dim] && _(province)[dim0]) {
        var value = parseFloat(_(province)[dim0]) * regression[0] + regression[1] - parseFloat(_(province)[dim])

        if (value < min) min = value
        if (value > max) max = value

      }
    }
    return [-max, -min]
  }

  ngOnInit(): void {
    var variables = this.variables
    var ready = this.ready
    var geoData = 'http://localhost:5000/'
    var projection = d3.geoMercator()
    var path = d3.geoPath().projection(projection)
    var tooltip = $('tooltip')

    d3.json(geoData).then((data) => {
      for (var entry of data[0][0].features) {
        for (var property in entry.properties) {
          if (entry.properties[property]) {
            // Replace German decimal commas
            entry.properties[property] = entry.properties[property].toString().replace('.', '').replace(',', '.')
          }
        }
      }
      variables.emit(data[0][0].features[0].properties)
      render(data[0][0])
    })

    // Uses geometric data to create an svg map. Takes a while because it is very detailed
    function render(geojson) {

      projection.fitExtent(
        [
          [0, 0],
          [window.innerWidth, window.innerHeight - 100],
        ],
        geojson
      )

      path({ type: 'FeatureCollection', features: geojson.features })
      ready.emit(true)
      $('loading').style.display = 'none'


      d3.select('#map')
        .selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('class', 'provinceElement')
        .attr('d', path)
        // This highlights and prints data about the currently hovered state
        .on('mouseenter', (e, d) => {
          if (e.srcElement.style.opacity !== '0') {
            e.srcElement.style.opacity = 0.75
            tooltip.innerHTML = ''
            var standard = ['name']
            for (var prop in d.properties) {
              if (standard.includes(prop)) {
                tooltip.innerHTML += prop + ': ' + d.properties[prop] + '<br>'
              }
            }
            for (var prop in d.properties) {
              if (localStorage.getItem('variables')?.split(',').includes(prop)) {
                tooltip.innerHTML += getText(prop) + ': ' + d.properties[prop] + '<br>'
              }
            }
            tooltip.style.display = "block"
          }
        })
        .on('mouseleave', e => {
          if (e.srcElement.style.opacity !== '0')
            e.srcElement.style.opacity = 1
          tooltip.style.display = "none"
        })
    }
    // This enables zooming the map
    d3.select('svg').call(
      d3
        .zoom()
        .scaleExtent([1, 100])
        .on('zoom', e => {
          d3.select('svg g').attr('transform', e.transform)
        })
    )
    document.addEventListener('mousemove', fn, false)
    function fn(e) {
      tooltip.style.left = e.pageX + 'px'
      tooltip.style.top = e.pageY + 'px'
    }
  }
}
