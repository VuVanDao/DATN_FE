import { Observable } from 'rxjs';
import { CreateProjectRequest, Project } from '../models/project.model';

export abstract class ProjectRepository {
  abstract createProject(request: CreateProjectRequest): Observable<Project>;
}
