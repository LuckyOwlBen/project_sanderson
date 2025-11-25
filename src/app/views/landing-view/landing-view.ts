import { Component } from '@angular/core';
import { AncestrySelector } from "../../components/ancestry-selector/ancestry-selector";

@Component({
  selector: 'app-landing-view',
  imports: [AncestrySelector],
  templateUrl: './landing-view.html',
  styleUrl: './landing-view.scss',
})
export class LandingView {

}
