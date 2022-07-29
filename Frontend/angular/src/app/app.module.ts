import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppComponent } from './app.component'
import { MapComponent } from './map/map.component'
import { HeaderComponent } from './header/header.component'
import { PlotComponent } from './plot/plot.component';
import { SettingsComponent } from './settings/settings.component'

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    HeaderComponent,
    PlotComponent,
    SettingsComponent,
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
