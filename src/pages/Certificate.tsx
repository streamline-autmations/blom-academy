import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { getCourseData } from '@/data/mock';
import { useUserState } from '@/hooks/useUserState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Download, Award, Snowflake } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { downloadCertificatePdf } from '@/lib/certificatePdf';

const Certificate = () => {
  const { slug } = useParams<{ slug: string }>();
  const { profile } = useAuth();
  const { getCourseProgress, getCourseCompletedAt } = useUserState();
  // First computed completion date per course, kept so rewatching lessons can't change it.
  const [savedDates, setSavedDates] = useLocalStorage<Record<string, string>>('blom:certificateDates', {});
  const [downloading, setDownloading] = useState(false);
  const data = getCourseData(slug || '');
  const courseId = data?.course.id ?? '';
  const isComplete = !!data && getCourseProgress(courseId) >= 100;
  const completedAt = savedDates[courseId] ?? getCourseCompletedAt(courseId) ?? new Date().toISOString();

  useEffect(() => {
    if (isComplete && !savedDates[courseId]) {
      setSavedDates(prev => ({ ...prev, [courseId]: completedAt }));
    }
  }, [isComplete, courseId, completedAt, savedDates, setSavedDates]);

  if (!data) {
    return <Navigate to="/400" replace />;
  }

  const { course } = data;
  const progress = getCourseProgress(course.id);
  const isHolidayCourse = slug === 'holiday-watercolor-workshop';

  if (progress < 100) {
    // Redirect if the user hasn't completed the course
    toast.error("You must complete the course to view the certificate.");
    return <Navigate to={`/course/${slug}`} replace />;
  }

  const userName = profile ? `${profile.first_name} ${profile.last_name}` : 'Valued Student';
  const completionDate = new Date(completedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCertificatePdf({
        name: userName,
        courseTitle: course.title,
        date: completionDate,
        accentColor: isHolidayCourse ? '#f472b6' : '#4da6ff',
        fileName: `BLOM-Academy-Certificate-${course.slug}.pdf`,
      });
      toast.success("Your certificate download has started!");
    } catch (error) {
      console.error('Certificate download failed', error);
      toast.error("We couldn't create your certificate. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bloom flex items-center justify-center p-4 sm:p-8">
      <div className={cn(
        "w-full max-w-4xl bg-white/90 dark:bg-blom-dark-card/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-10 border-4 relative overflow-hidden",
        isHolidayCourse ? "border-accent-foreground/20" : "border-primary/20"
      )}>
        {isHolidayCourse && (
          <>
            <Snowflake className="absolute top-4 left-4 w-12 h-12 text-sky-200 dark:text-sky-500/20 opacity-70" />
            <Snowflake className="absolute bottom-4 right-4 w-16 h-16 text-sky-200 dark:text-sky-500/20 opacity-70" />
            <Snowflake className="absolute top-1/2 right-8 w-8 h-8 text-sky-200 dark:text-sky-500/20 opacity-70" />
          </>
        )}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Award className={cn("w-16 h-16", isHolidayCourse ? "text-accent-foreground" : "text-primary")} />
          </div>
          <h1 className={cn(
            "text-2xl sm:text-4xl font-bold tracking-wider uppercase",
            isHolidayCourse ? "text-accent-foreground" : "text-primary"
          )}>
            Certificate of Completion
          </h1>
          <p className="text-base sm:text-lg text-body-text">This certificate is proudly presented to</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-ink italic">
            {userName}
          </h2>
          <p className="text-base sm:text-lg text-body-text max-w-2xl mx-auto">
            for successfully completing the course
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-ink">
            {course.title}
          </h3>
          <p className="text-sm text-body-text/80">on {completionDate}</p>
          <div className="flex justify-center pt-4">
            <img src="/blom-academy.png" alt="BLOM Academy Logo" className="h-16" />
          </div>
        </div>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleDownload} disabled={downloading} className="rounded-full font-bold">
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Preparing…' : 'Download Certificate'}
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <Link to={`/course/${course.slug}`}>Back to Course</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
