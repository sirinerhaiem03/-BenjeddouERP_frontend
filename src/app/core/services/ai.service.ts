import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiService {
  private apiUrl = `${environment.apiUrl}/ai`;
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpenSubject.asObservable();

  constructor(private http: HttpClient) {}

  toggleChat(): void {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  openChat(): void {
    this.isOpenSubject.next(true);
  }

  closeChat(): void {
    this.isOpenSubject.next(false);
  }

  get isOpen(): boolean {
    return this.isOpenSubject.value;
  }

  chatWithAssistant(message: string, lang: string = 'fr', route: string = '', role: string = ''): Observable<any> {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.post<any>(`${this.apiUrl}/chat`, { message, lang, route, role }, { headers });
  }

  processOcrDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/ocr`, formData);
  }
}
