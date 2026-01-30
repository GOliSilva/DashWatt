'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { firebaseAuth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/components/auth-provider';
import { toast } from 'sonner';
export function UserNav() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const userProfile = user
    ? {
      fullName: user.displayName ?? user.email ?? 'Usuario',
      imageUrl: user.photoURL ?? '',
      emailAddresses: [{ emailAddress: user.email ?? '' }]
    }
    : null;

  const handleSignOut = async () => {
    if (!firebaseAuth) {
      toast.error('Firebase nao configurado.');
      return;
    }

    try {
      await signOut(firebaseAuth);
      router.replace('/auth/sign-in');
    } catch (error) {
      toast.error('Nao foi possivel sair.');
    }
  };

  if (loading) {
    return (
      <div className='h-8 w-8 animate-pulse rounded-full bg-muted' />
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <UserAvatarProfile user={userProfile} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-56'
        align='end'
        sideOffset={10}
        forceMount
      >
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm leading-none font-medium'>
              {userProfile.fullName}
            </p>
            <p className='text-muted-foreground text-xs leading-none'>
              {userProfile.emailAddresses[0].emailAddress}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/dashboard/individual')}>
            Profile
          </DropdownMenuItem>
          {/* Billing, Settings, New Team removed as per request */}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
