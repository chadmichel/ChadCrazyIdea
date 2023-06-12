import { Injectable } from '@angular/core';
import { User } from '../data/User';
import { Observable } from 'rxjs';

function makeObservable<T>(data: T): Observable<T> {
  return new Observable<T>((subscriber) => {
    subscriber.next(data);
    subscriber.complete();
  });
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user: Observable<User> = makeObservable<User>({
    id: '',
    name: '',
    email: '',
    jwt: '',
    lastLogin: undefined,
    isAdmin: false,
    isAuth: false,
  });

  constructor() {}
}
