import { inject, Component } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public auth = inject(AuthenticationService);
  public onLogout(): void { this.auth.logout(); }

  title = 'GameBrowse Admin';
}
