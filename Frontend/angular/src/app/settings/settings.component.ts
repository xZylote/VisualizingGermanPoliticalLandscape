// @ts-nocheck
import { Component, EventEmitter, Output } from '@angular/core'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  @Output() settings = new EventEmitter()

  foo(x) {
    this.settings.emit({ [x]: $(x).checked })
    if (x == 'saturation') {
      console.log($c('hide'))
      for (var elem of $c('hide')) {
        elem.style.display = $(x).checked ? 'inline' : 'none'
      }
    }
  }
  bar(x) {
    this.settings.emit({ [x]: $(x).value })
  }
}
