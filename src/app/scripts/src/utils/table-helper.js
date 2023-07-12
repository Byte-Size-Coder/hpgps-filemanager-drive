import React from 'react';
import { createColumnHelper, sortingFns } from '@tanstack/react-table';

import { Tooltip } from 'react-tooltip';

import { makeid } from '../utils/formatter';

import { rankItem, compareItems } from '@tanstack/match-sorter-utils';

const columnHelper = createColumnHelper();

const displayCell = (value) => {
    const content = `${value.slice(0, 5).join(', ')}${value.length > 5 ? '...' : ''}`;

    const tooltipId = `content-tooltip-${makeid(20)}`;
    return (
        <>
            {value.length > 5 ? (
                <div
                    data-tooltip-id={tooltipId}
                    data-tooltip-content={`${value.join(', ')}`}
                    data-tooltip-place="top"
                    style={{ cursor: 'help' }}
                >
                    {content}
                    <Tooltip id={tooltipId} />
                </div>
            ) : (
                <div>{content}</div>
            )}
        </>
    );
};

const fuzzySort = (rowA, rowB, columnId) => {
    let dir = 0;

    // Only sort by rank if the column has ranking information
    if (rowA.columnFiltersMeta[columnId]) {
        dir = compareItems(
            rowA.columnFiltersMeta[columnId].itemRank,
            rowB.columnFiltersMeta[columnId].itemRank
        );
    }

    // Provide an alphanumeric fallback for when the item ranks are equal
    return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

export const columns = [
    columnHelper.accessor('fileName', {
        header: () => 'File',
        cell: (info) => info.renderValue(),
        filterFn: 'fuzzy',
        sortingFn: fuzzySort,
    }),
    columnHelper.accessor('associated', {
        header: () => 'Associated With',
        cell: (info) => info.renderValue(),
        filterFn: 'fuzzy',
        sortingFn: fuzzySort,
    }),
    columnHelper.accessor('action', {
        header: () => 'Action',
        cell: (info) => info.renderValue(),
    }),
];

export const fuzzyFilter = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value);

    // Store the itemRank info
    addMeta({
        itemRank,
    });

    // Return if the item should be filtered in/out
    return itemRank.passed;
};
