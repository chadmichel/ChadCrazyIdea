import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-table-def-list',
  templateUrl: './table-def-list.component.html',
  styleUrls: ['./table-def-list.component.scss'],
})
export class TableDefListComponent implements OnInit {
  products = [
    {
      code: 'a',
      name: 'b',
    },
  ];
  constructor() {}

  ngOnInit(): void {}
}
