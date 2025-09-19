'use client';

import { CheckCircle2, TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const skillsInProgress = [
  { name: 'Advanced TypeScript', value: 75 },
  { name: 'GraphQL', value: 40 },
  { name: 'UI/UX Design Principles', value: 60 },
  { name: 'DevOps Fundamentals', value: 25 },
];

const completedSkills = [
  { name: 'React Best Practices' },
  { name: 'State Management with Zustand' },
];

export function ProgressTracker() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <CardTitle>Progress Tracker</CardTitle>
        </div>
        <CardDescription>
          Your journey to mastering new skills.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-4 text-md font-medium">Skills in Progress</h3>
          <div className="space-y-4">
            {skillsInProgress.map((skill) => (
              <div key={skill.name}>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {skill.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {skill.value}%
                  </span>
                </div>
                <Progress value={skill.value} aria-label={`${skill.name} progress`} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-md font-medium">Completed Skills</h3>
          <ul className="space-y-2">
            {completedSkills.map((skill) => (
              <li key={skill.name} className="flex items-center text-sm text-muted-foreground">
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                {skill.name}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
