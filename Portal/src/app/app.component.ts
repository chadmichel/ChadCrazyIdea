import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Portal';
  items: MenuItem[] = [];

  ngOnInit() {
    this.items = [
      {
        label: 'Admin',
        icon: 'pi-sliders-h',
      },
    ];
  }
}
