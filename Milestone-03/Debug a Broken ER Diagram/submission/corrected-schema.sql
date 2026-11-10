-- TaskSphere corrected relational schema
-- PostgreSQL 15+
-- Fixes missing keys, invalid types, absent relationships, duplication, and weak validation.

BEGIN;

CREATE TABLE team_members (
    member_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(320) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_team_members_email UNIQUE (email),
    CONSTRAINT chk_team_members_email_nonblank CHECK (length(trim(email)) > 3)
);

CREATE TABLE projects (
    project_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_name VARCHAR(200) NOT NULL,
    project_key VARCHAR(20) NOT NULL,
    description TEXT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_projects_project_key UNIQUE (project_key),
    CONSTRAINT chk_projects_name_nonblank CHECK (length(trim(project_name)) > 0),
    CONSTRAINT chk_projects_key_format CHECK (project_key ~ '^[A-Z][A-Z0-9_-]{1,19}$'),
    CONSTRAINT fk_projects_created_by
        FOREIGN KEY (created_by) REFERENCES team_members (member_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Many-to-many relationship: members can collaborate on many projects.
CREATE TABLE project_members (
    project_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(30) NOT NULL DEFAULT 'member',
    PRIMARY KEY (project_id, member_id),
    CONSTRAINT fk_project_members_project
        FOREIGN KEY (project_id) REFERENCES projects (project_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_project_members_member
        FOREIGN KEY (member_id) REFERENCES team_members (member_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_project_members_role CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
);

CREATE TABLE tasks (
    task_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id BIGINT NOT NULL,
    title VARCHAR(250) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'todo',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    due_date DATE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_project
        FOREIGN KEY (project_id) REFERENCES projects (project_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tasks_created_by
        FOREIGN KEY (created_by) REFERENCES team_members (member_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_tasks_title_nonblank CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_tasks_status CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
    CONSTRAINT chk_tasks_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- Many-to-many relationship: tasks may have zero or more valid assignees.
CREATE TABLE task_assignees (
    task_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, member_id),
    CONSTRAINT fk_task_assignees_task
        FOREIGN KEY (task_id) REFERENCES tasks (task_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_task_assignees_member
        FOREIGN KEY (member_id) REFERENCES team_members (member_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_projects_created_by ON projects (created_by);
CREATE INDEX idx_project_members_member_id ON project_members (member_id);
CREATE INDEX idx_tasks_project_status ON tasks (project_id, status);
CREATE INDEX idx_tasks_created_by ON tasks (created_by);
CREATE INDEX idx_tasks_due_date ON tasks (due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_task_assignees_member_id ON task_assignees (member_id);

COMMIT;
