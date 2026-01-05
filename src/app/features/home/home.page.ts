import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  constructor(private readonly router: Router) {}

  ngOnInit() {
    
  }

  cadastro() {
    this.router.navigate(['/students/cadastrar']);
  }

  aluno() {
    this.router.navigate(['/students']);
  }

  financeiro() {
    this.router.navigate(['/students/finance']);
  }
}
