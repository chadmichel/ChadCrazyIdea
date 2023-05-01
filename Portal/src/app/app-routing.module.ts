import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TableDefListComponent } from './Admin/TableDef/table-def-list/table-def-list.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: 'admin/tabledef/list', component: TableDefListComponent },
  { path: '**', component: HomeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
