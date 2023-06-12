import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import {
  BreakpointObserver,
  Breakpoints,
  MediaMatcher,
} from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MatToolbar } from '@angular/material/toolbar';
import { MatSidenav } from '@angular/material/sidenav';
import { NavLink } from './nav-link';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-navs',
  templateUrl: './navs.component.html',
  styleUrls: ['./navs.component.scss'],
})
export class NavsComponent {
  allLinks: NavLink[] = [
    {
      icon: 'info',
      label: 'Info',
      path: '/info',
      isAdmin: false,
      isAuth: false,
    },
    {
      icon: 'login',
      label: 'Login',
      path: '/login',
      isAdmin: false,
      isAuth: false,
    },
    {
      icon: 'app_registration',
      label: 'Register',
      path: '/register',
      isAdmin: false,
      isAuth: false,
    },
    {
      icon: 'home',
      label: 'Home',
      path: '/home',
      isAdmin: false,
      isAuth: true,
    },
    {
      icon: 'admin_panel_settings',
      label: 'Admin',
      path: '/Admin',
      isAdmin: true,
      isAuth: true,
    },
    {
      icon: 'contacts',
      label: 'Contacts',
      path: '/Contacts',
      isAdmin: false,
      isAuth: true,
    },
    {
      icon: 'groups',
      label: 'Groups',
      path: '/Groups',
      isAdmin: false,
      isAuth: true,
    },
    {
      icon: 'work',
      label: 'Work',
      path: '/Work',
      isAdmin: false,
      isAuth: true,
    },
  ];
  links: NavLink[] = this.allLinks.filter((link) => !link.isAuth);

  constructor(private userService: UserService) {
    this.userService.user.subscribe((user) => {
      if (user.isAuth) {
        if (user.isAdmin) {
          this.links = this.allLinks.filter(
            (link) => link.isAdmin || link.isAuth
          );
        } else {
          this.links = this.allLinks.filter((link) => link.isAuth);
        }
      }
    });
  }

  ngOnDestroy(): void {}

  navClick(link: NavLink): void {
    alert(link.path);
  }
}
