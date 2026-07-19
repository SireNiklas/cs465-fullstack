import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowseItem, BrowseConfig, BrowseAction } from '../browse-item.model';
import { BrowseCardComponent } from '../browse-card/browse-card.component';

// Reusable list. Takes BrowseItems + config, does a simple in-browser search,
// lays them out as cards, and passes card actions back up. Knows nothing about
// trips.
@Component({
  selector: 'app-browse-list',
  standalone: true,
  imports: [CommonModule, FormsModule, BrowseCardComponent],
  templateUrl: './browse-list.component.html',
  styleUrls: ['./browse-list.component.css'],
})
export class BrowseListComponent {
  @Input() items: BrowseItem[] = [];
  @Input() config: BrowseConfig = {};
  @Output() action = new EventEmitter<BrowseAction>();

  searchTerm = '';

  get filteredItems(): BrowseItem[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return this.items;
    }
    return this.items.filter((item) =>
      item.title.toLowerCase().includes(query) ||
      (item.subtitle?.toLowerCase().includes(query) ?? false) ||
      (item.tags?.some((tag) => tag.toLowerCase().includes(query)) ?? false)
    );
  }

  onAction(action: BrowseAction): void {
    this.action.emit(action);
  }
}
