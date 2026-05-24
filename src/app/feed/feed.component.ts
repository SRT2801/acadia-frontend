import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MOCK_POSTS, MOCK_COURSES, MOCK_MESSAGES, MOCK_NETWORK, MOCK_CALENDAR } from './mock/feed.mock';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css',
})
export class FeedComponent {
  posts = MOCK_POSTS;
  courses = MOCK_COURSES;
  messages = MOCK_MESSAGES;
  network = MOCK_NETWORK;
  calendar = MOCK_CALENDAR;
}
