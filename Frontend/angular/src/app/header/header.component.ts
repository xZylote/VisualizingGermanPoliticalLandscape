// @ts-nocheck
import { Component, EventEmitter, Output, Input } from '@angular/core'

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})

export class HeaderComponent {
  @Output() dataChange = new EventEmitter() // All selected variables
  @Output() anaType = new EventEmitter() // Absolute ([]) or correlation-based ([1]) visualization type
  @Input() variables = [] // All variables from the backend data
  @Input() ready = false

  ngOnChanges(changes) {
    if (changes['ready'] && this.ready)
      $('addButton').style.display = 'block'
  }
  // Toggle bivariate analysis method
  setFlag() {
    if ($('corrButton').innerHTML == 'Absolute') {
      this.anaType.emit([1])
      $('corrButton').innerHTML = 'Correlation'
    } else {
      this.anaType.emit([])
      $('corrButton').innerHTML = 'Absolute'
    }
  }

  // Creates a new select dropdown where user can choose another variable to be visualize
  addVariable() {
    var div = document.createElement('div')
    var selector = document.createElement('select')
    selector.classList.add('form-select')
    var option = document.createElement('option')
    option.setAttribute('value', null)
    option.innerHTML = '- Select variable -'
    selector.appendChild(option)
    if (this.variables) {
      for (var key in this.variables) {
        // Assign names to the variables
        var name
        name = getText(key)
        if (name == 'Error') continue
        var option = document.createElement('option')
        option.setAttribute('value', key)
        option.innerHTML = name
        selector.appendChild(option)
      }
    }
    // Update visualization when user changes variable selection
    selector.addEventListener('change', () => {
      var choice = []
      for (var variable of $t('select')) {
        if (variable[variable.selectedIndex].value != 'null') {
          choice.push(variable[variable.selectedIndex].value)
        }
      }
      this.dataChange.emit(choice)
    })
    div.appendChild(selector)
    // Each of the dropdown selections can be removed by clicking the button next to it which will also update visualization.
    var xbutton = document.createElement('button')
    xbutton.appendChild(document.createTextNode('Remove'))

    xbutton.onclick = function () {
      this.parentElement.remove()
    }
    xbutton.addEventListener('click', () => {
      var choice = []
      for (var variable of $t('select')) {
        if (variable[variable.selectedIndex].value != 'null') {
          choice.push(variable[variable.selectedIndex].value)
        }
      }
      this.dataChange.emit(choice)
      if ($t('select').length == 2) {
        $('corrButton').style.display = 'inline'
      }
      if ($t('select').length == 3 || $t('select').length == 1) {
        $('corrButton').style.display = 'none'
      }
    })
    xbutton.classList.add('btn', 'btn-danger')
    div.classList.add("input-group")
    div.style.margin = "8px"
    div.appendChild(xbutton)
    $('selectorContainer').appendChild(div)

    // It is only possible to change analysis method for the bivariate case
    if ($t('select').length == 2) {
      $('corrButton').style.display = 'inline'
    }
    if ($t('select').length == 3 || $t('select').length == 1) {
      $('corrButton').style.display = 'none'
    }
  }

}
