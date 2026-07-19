import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Trip } from '../models/trip';
import { TripDataService } from '../trip-data.service';
import { BrowseModule } from '../browse/browse.module';
import { BrowseItem, BrowseConfig, BrowseAction } from '../browse/browse-item.model';

// Trip admin, now built on the shared browse components. This file is just the
// glue: pull trips, map them to BrowseItems, turn browse actions into
// edit/delete. The list + search live in the browse module now.
@Component({
  selector: 'app-trip-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, BrowseModule],
  templateUrl: './trip-listing.component.html',
  styleUrls: ['./trip-listing.component.css'],
})
export class TripListingComponent implements OnInit {
  items: BrowseItem[] = [];
  message = '';

  config: BrowseConfig = {
    heading: 'Trip Administration',
    searchPlaceholder: 'Search trips by name, resort, or length...',
    primaryActionLabel: 'Edit',
    secondaryActionLabel: 'Delete',
    emptyMessage: 'No trips found.',
  };

  constructor(
    private tripDataService: TripDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.tripDataService.getTrips().subscribe({
      next: (trips) => { this.items = trips.map((t) => this.toBrowseItem(t)); },
      error: (err) => { this.message = 'Error loading trips: ' + err.message; },
    });
  }

  private toBrowseItem(trip: Trip): BrowseItem {
    return {
      id: trip.code,
      title: trip.name,
      subtitle: trip.resort,
      image: trip.image,
      description: trip.description,
      tags: [trip.length],
      raw: trip,
    };
  }

  onAction(action: BrowseAction): void {
    if (action.kind === 'primary') {
      localStorage.setItem('tripCode', action.item.id);
      this.router.navigate(['edit-trip']);
    } else {
      this.deleteTrip(action.item.id);
    }
  }

  private deleteTrip(code: string): void {
    if (confirm('Delete this trip?')) {
      this.tripDataService.deleteTrip(code).subscribe({
        next: () => this.load(),
        error: (err) => console.error('Delete failed', err),
      });
    }
  }
}
