import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Trip } from '../models/trip';
import { TripDataService } from '../trip-data.service';
import { TripCardComponent } from '../trip-card/trip-card.component';

@Component({
  selector: 'app-trip-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, TripCardComponent],
  templateUrl: './trip-listing.component.html',
  styleUrls: ['./trip-listing.component.css']
})
export class TripListingComponent implements OnInit {
  trips: Trip[] = [];
  message: string = '';

  constructor(private tripDataService: TripDataService) {}

  ngOnInit(): void { this.getTrips(); }

  getTrips(): void {
    this.tripDataService.getTrips().subscribe({
      next: (trips) => { this.trips = trips; },
      error: (err)  => { this.message = 'Error loading trips: ' + err.message; }
    });
  }
}
