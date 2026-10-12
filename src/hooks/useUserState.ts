import { useLocalStorage } from './useLocalStorage';
import type { Progress, Bookmark, Notes } from '@/data/types';
import { lessons, modules, courses, getCourseData } from '@/data/mock';
import { useCallback } from 'react';

// A helper to get all courses, including hidden ones, for internal logic.
const getAllCourses = () => {
    const holiday = getCourseData('holiday-watercolor-workshop');
    const watercolour = getCourseData('online-watercolour-workshop');
    return [holiday?.course, watercolour?.course].filter(Boolean);
}

export const useUserState = () => {
  const [progress, setProgress] = useLocalStorage<Progress[]>('blom:progress', []);
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('blom:bookmarks', []);
  const [notes, setNotes] = useLocalStorage<Notes>('blom:notes', {});
  const [lastLesson, setLastLesson] = useLocalStorage<{ [courseId: string]: string }>('blom:lastLesson', {});

  // Progress Management
  const getLessonProgress = useCallback((lessonId: string) => {
    return progress.find(p => p.lessonId === lessonId);
  }, [progress]);

  const updateLessonProgress = (lessonId: string, watchedSec: number) => {
    const now = new Date().toISOString();
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const module = modules.find(m => m.id === lesson.moduleId);
    if (module) {
      setLastLesson(prev => ({ ...prev, [module.courseId]: lessonId }));
    }

    const isCompleted = watchedSec >= lesson.durationSec * 0.95;
    
    setProgress(prev => {
      const existing = prev.find(p => p.lessonId === lessonId);
      if (existing) {
        return prev.map(p => p.lessonId === lessonId ? { ...p, watchedSec: Math.max(p.watchedSec, watchedSec), completed: p.completed || isCompleted, updatedAt: now } : p);
      }
      return [...prev, { lessonId, watchedSec, completed: isCompleted, updatedAt: now }];
    });
  };
  
  const toggleLessonComplete = (lessonId: string) => {
    const now = new Date().toISOString();
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    setProgress(prev => {
        const existing = prev.find(p => p.lessonId === lessonId);
        if (existing) {
            return prev.map(p => p.lessonId === lessonId ? { ...p, completed: !p.completed, updatedAt: now } : p);
        }
        return [...prev, { lessonId, watchedSec: 0, completed: true, updatedAt: now }];
    });
  }

  const getCourseProgress = useCallback((courseId: string) => {
    const courseModules = modules.filter(m => m.courseId === courseId);
    const courseModuleIds = courseModules.map(m => m.id);
    const courseLessons = lessons.filter(l => courseModuleIds.includes(l.moduleId));
    if (courseLessons.length === 0) return 0;

    const completedLessons = courseLessons.filter(l => progress.find(p => p.lessonId === l.id && p.completed));
    return (completedLessons.length / courseLessons.length) * 100;
  }, [progress]);

  // Latest time a lesson in this course was marked complete (ISO string), or null if none.
  const getCourseCompletedAt = useCallback((courseId: string) => {
    const courseModuleIds = modules.filter(m => m.courseId === courseId).map(m => m.id);
    const courseLessonIds = lessons.filter(l => courseModuleIds.includes(l.moduleId)).map(l => l.id);
    const times = progress
      .filter(p => p.completed && courseLessonIds.includes(p.lessonId))
      .map(p => p.updatedAt)
      .sort();
    return times.length ? times[times.length - 1] : null;
  }, [progress]);

  const getModuleProgress = useCallback((moduleId: string) => {
    const moduleLessons = lessons.filter(l => l.moduleId === moduleId);
    if (moduleLessons.length === 0) return 0;

    const completedLessons = moduleLessons.filter(l => progress.find(p => p.lessonId === l.id && p.completed));
    return (completedLessons.length / moduleLessons.length) * 100;
  }, [progress]);

  const continueWatchingList = progress
    .filter(p => !p.completed && p.watchedSec > 0)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map(p => lessons.find(l => l.id === p.lessonId))
    .filter(Boolean);

  const getEnrolledCourses = useCallback(() => {
    // Assume user is "enrolled" in all courses for this mock data version
    return courses;
  }, []);

  // Bookmark Management
  const isBookmarked = useCallback((lessonId: string) => {
    return bookmarks.some(b => b.lessonId === lessonId);
  }, [bookmarks]);

  const toggleBookmark = (lessonId: string) => {
    setBookmarks(prev => {
      if (isBookmarked(lessonId)) {
        return prev.filter(b => b.lessonId !== lessonId);
      }
      return [...prev, { lessonId, createdAt: new Date().toISOString() }];
    });
  };

  const bookmarkedLessons = bookmarks
    .map(b => {
        const lesson = lessons.find(l => l.id === b.lessonId);
        if (!lesson) return null;
        const module = modules.find(m => m.id === lesson.moduleId);
        const allCourses = getAllCourses();
        const course = allCourses.find(c => c.id === module?.courseId);
        return { ...lesson, courseTitle: course?.title || '', createdAt: b.createdAt };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Notes Management
  const getLessonNote = useCallback((lessonId: string) => {
    return notes[lessonId] || '';
  }, [notes]);

  const updateLessonNote = (lessonId: string, content: string) => {
    setNotes(prev => ({ ...prev, [lessonId]: content }));
  };

  return {
    progress,
    getLessonProgress,
    updateLessonProgress,
    toggleLessonComplete,
    getCourseProgress,
    getCourseCompletedAt,
    getModuleProgress,
    continueWatchingList,
    getEnrolledCourses,
    bookmarks,
    isBookmarked,
    toggleBookmark,
    bookmarkedLessons,
    notes,
    getLessonNote,
    updateLessonNote,
    lastLesson,
  };
};
