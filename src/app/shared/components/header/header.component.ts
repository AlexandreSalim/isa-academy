import { Component, Input, OnInit } from '@angular/core';
import { IonIcon } from "@ionic/angular/standalone";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonIcon]
})
export class HeaderComponent  implements OnInit {

    @Input() title: string = 'Title';

  constructor() { }

  ngOnInit() {}

    back() {
    history.back();
  }
}
