import { Observable } from 'rxjs';
import { CreateProjectRequest, Project } from '../models/project.model';

export abstract class ProjectRepository {
  abstract createPrject(request: CreateProjectRequest): Observable<Project>;
}
