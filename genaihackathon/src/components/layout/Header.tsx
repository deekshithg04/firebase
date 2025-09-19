'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Briefcase,
  Bot,
  BrainCircuit
} from 'lucide-react';
import { getAuth, onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { app } from '@/lib/firebase';
import { useState, useEffect } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useToast } from '@/hooks/use-toast';

const pageTitles: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/dashboard/digital-twin': 'Digital Twin',
  '/dashboard/career-path': 'Career Path Simulation',
  '/dashboard/ai-advisor': 'AI Skill Advisor',
  '/dashboard/profile': 'User Profile',
};

const pageIcons: { [key: string]: React.ReactNode } = {
    '/dashboard': <LayoutDashboard className="h-6 w-6" />,
    '/dashboard/digital-twin': <BrainCircuit className="h-6 w-6" />,
    '/dashboard/career-path': <Briefcase className="h-6 w-6" />,
    '/dashboard/ai-advisor': <Bot className="h-6 w-6" />,
    '/dashboard/profile': <User className="h-6 w-6" />,
  };

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleLogout = async () => {
    try {
        await signOut(auth);
        router.push('/');
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.'})
    } catch (error) {
        console.error('Error logging out:', error);
        toast({ variant: 'destructive', title: 'Logout Failed', description: 'Could not log you out. Please try again.'})
    }
  }


  const title = pageTitles[pathname] || 'SkillSculptor';
  const icon = pageIcons[pathname] || null;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/60 px-4 backdrop-blur-sm md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>

      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </div>


      <div className="ml-auto flex items-center gap-4">
        { user && (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'Welcome'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                    </p>
                </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>
    </header>
  );
}
