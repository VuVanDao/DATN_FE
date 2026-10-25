import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateProjectRequest, Project } from '../../domain/models/project.model';
import { ProjectRepository } from '../../domain/repositories/project.repository';
import { ApiResponse } from '../dtos/api-response.dto';

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
