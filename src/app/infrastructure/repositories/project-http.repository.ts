import { inject, Injectable } from '@angular/core';
import { ProjectRepository } from '../../domain/repositories/project.repository';
import { map, Observable } from 'rxjs';
import { CreateProjectRequest, Project } from '../../domain/models/project.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../dtos/auth.dto';

@Injectable({
  providedIn: 'root',
})
export class ProjectHttpRepository implements ProjectRepository {
  private readonly API_URL = `${environment.apiUrl}/project`;
  private readonly http = inject(HttpClient);
  createProject(request: CreateProjectRequest): Observable<Project> {
    return this.http.post<ApiResponse<Project>>(this.API_URL, request).pipe(map((res) => res.data));
  }
}
