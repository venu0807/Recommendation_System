import React from 'react';
import { render } from '@testing-library/react';
import { SkeletonElement, SkeletonMovieCard, SkeletonPersonCard, SkeletonMovieDetail, SkeletonSearchResult, SkeletonProfile } from './Skeleton';

describe('Skeleton components', () => {
  test('SkeletonElement renders with given type class', () => {
    const { container } = render(<SkeletonElement type="title" />);
    const element = container.querySelector('.skeleton');
    expect(element).toBeInTheDocument();
    expect(element.className).toContain('title');
  });

  test('SkeletonMovieCard renders skeleton elements', () => {
    const { container } = render(<SkeletonMovieCard />);
    expect(container.querySelector('.skeleton-movie-card')).toBeInTheDocument();
    expect(container.querySelector('.skeleton.image')).toBeInTheDocument();
    expect(container.querySelector('.skeleton.title')).toBeInTheDocument();
    expect(container.querySelector('.skeleton.text')).toBeInTheDocument();
  });

  test('SkeletonPersonCard renders', () => {
    const { container } = render(<SkeletonPersonCard />);
    expect(container.querySelector('.skeleton-person-card')).toBeInTheDocument();
    expect(container.querySelector('.skeleton.circle')).toBeInTheDocument();
  });

  test('SkeletonMovieDetail renders', () => {
    const { container } = render(<SkeletonMovieDetail />);
    expect(container.querySelector('.skeleton-movie-detail')).toBeInTheDocument();
    expect(container.querySelector('.skeleton.poster')).toBeInTheDocument();
  });

  test('SkeletonSearchResult renders', () => {
    const { container } = render(<SkeletonSearchResult />);
    expect(container.querySelector('.skeleton-search-result')).toBeInTheDocument();
    expect(container.querySelector('.skeleton.thumbnail')).toBeInTheDocument();
  });

  test('SkeletonProfile renders', () => {
    const { container } = render(<SkeletonProfile />);
    expect(container.querySelector('.skeleton-profile')).toBeInTheDocument();
  });
});
