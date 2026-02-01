import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CharacterId {

  private currentId: string | null = null;
  constructor(private http: HttpClient) {}
  //todo: implement 
  newId() {
    this.http.get<{ id: string }>('/api/character/newCharacter').subscribe(response => {
      this.currentId = response.id;

    });
  }

  getId(): string | null {
    return this.currentId;
  }
}
