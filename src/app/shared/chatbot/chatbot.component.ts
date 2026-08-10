import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from './../../core/services/ai.service';

interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
  time: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isOpen = false;
  isTyping = false;
  userInput = '';
  messages: ChatMessage[] = [];

  constructor(private aiService: AiService) {}

  ngOnInit() {
    this.messages.push({
      text: "Bonjour ! Je suis l'assistant IA de BENJEDDOU ERP. Posez-moi vos questions sur les ventes, les stocks ou demandez-moi d'analyser vos données.",
      sender: 'ai',
      time: new Date()
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) {}
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const messageText = this.userInput.trim();
    this.messages.push({
      text: messageText,
      sender: 'user',
      time: new Date()
    });

    this.userInput = '';
    this.isTyping = true;
    this.scrollToBottom();

    this.aiService.chatWithAssistant(messageText).subscribe({
      next: (res) => {
        this.isTyping = false;
        this.messages.push({
          text: res.reply,
          sender: 'ai',
          time: new Date()
        });
        this.scrollToBottom();
      },
      error: (err) => {
        this.isTyping = false;
        this.messages.push({
          text: "Désolé, une erreur est survenue lors de la communication avec le serveur IA.",
          sender: 'ai',
          time: new Date()
        });
      }
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
