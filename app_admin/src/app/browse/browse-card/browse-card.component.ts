import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowseItem, BrowseConfig, BrowseAction } from '../browse-item.model';

// One card for one BrowseItem. Shows the fields, emits primary/secondary
// actions and lets the consumer decide what they mean.
@Component({
  selector: 'app-browse-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './browse-card.component.html',
  styleUrls: ['./browse-card.component.css'],
})
export class BrowseCardComponent {
  @Input() item!: BrowseItem;
  @Input() config: BrowseConfig = {};
  @Output() action = new EventEmitter<BrowseAction>();

  emit(kind: 'primary' | 'secondary'): void {
    this.action.emit({ kind, item: this.item });
  }
}
