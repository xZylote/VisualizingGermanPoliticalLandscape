// @ts-nocheck
import { Component } from '@angular/core'
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

// This does nothing besides forwarding data to the right places
export class AppComponent {
  selectedDataset = []
  data = []
  variables = []
  highlight = []
  anaType = []
  settings = [{ tooltips: true, lightness: true, saturation: true, intensity: 20, tolerance: 80 }, 0]
  ready = false

  forwardSelection(choice) { // No duplicates
    this.selectedDataset = choice.filter((item, pos) => {
      return choice.indexOf(item) == pos
    })
  }
  forwardData(data) { this.data = data }
  forwardAna(anaType) { this.anaType = anaType }
  forwardHighlight(highlight) { this.highlight = highlight }
  forwardSettings(settings) {
    for (var key in settings) {
      this.settings[0][key] = settings[key]
      console.log(key, settings, this.settings)
    }
    // We need to do this so angular detects a change
    var temp = this.settings[1]
    this.settings = [this.settings[0], temp + 1]
    console.log(this.settings)
  }
  forwardVariables(variables) { this.variables = variables }
  forwardReady(ready) { this.ready = ready }
}
