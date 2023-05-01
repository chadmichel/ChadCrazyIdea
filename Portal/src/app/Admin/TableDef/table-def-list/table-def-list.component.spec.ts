import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableDefListComponent } from './table-def-list.component';

describe('TableDefListComponent', () => {
  let component: TableDefListComponent;
  let fixture: ComponentFixture<TableDefListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableDefListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableDefListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
