import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AiService {
  private apiUrl = 'http://localhost:9090/api/ai';

  constructor(private http: HttpClient) {}

  chatWithAssistant(message: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/chat`, { message });
  }

  processOcrDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/ocr`, formData);
  }
}
