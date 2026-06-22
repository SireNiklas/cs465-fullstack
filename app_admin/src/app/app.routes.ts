import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth.guard';
import { TripListingComponent } from './trip-listing/trip-listing.component';
import { AddTripComponent } from './add-trip/add-trip.component';
import { EditTripComponent } from './edit-trip/edit-trip.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '',          component: TripListingComponent },
  { path: 'add-trip',  component: AddTripComponent, canActivate: [authGuard] },
  { path: 'edit-trip', component: EditTripComponent, canActivate: [authGuard] },
];
