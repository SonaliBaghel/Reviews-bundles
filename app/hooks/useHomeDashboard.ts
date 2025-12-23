import { useState, useCallback, useEffect } from 'react';
import { useLoaderData, useSearchParams, useNavigate, useActionData, useSubmit, useNavigation, useFetcher } from "@remix-run/react";
import { Review } from "../components/ReviewList";
import { ProductSummary } from "../components/ProductOverviewTable";

interface ReviewBundle {
    id: string; name: string; bundleProductId: string; productIds: string[];
}

interface ShopifyProduct {
    id: string;
    title: string;
    handle: string;
    imageUrl: string | null;
    numericId: string;
}

interface LoaderData {
    reviews: Review[]; totalReviews: number; averageRating: string;
    currentPage: number; reviewsPerPage: number;
    productSummaries: ProductSummary[]; bundles: ReviewBundle[];
    shopifyProducts: ShopifyProduct[];
}

interface ActionData {
    success?: boolean; message?: string; error?: string;
    csvData?: string; fileName?: string; invalidProducts?: string[];
}

export function useHomeDashboard() {
    const {
        reviews, totalReviews, averageRating, currentPage, reviewsPerPage,
        productSummaries, bundles, shopifyProducts
    } = useLoaderData<LoaderData>();

    const actionData = useActionData<ActionData>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const submit = useSubmit();
    const navigation = useNavigation();

    const exportFetcher = useFetcher<ActionData>();
    const importFetcher = useFetcher<ActionData>();
    const sampleFetcher = useFetcher<ActionData>();

    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [activeToast, setActiveToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastError, setToastError] = useState(false);

    const [selectedTab, setSelectedTab] = useState(0);
    const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState('highest-rating');

    const isExporting = exportFetcher.state === 'submitting';
    const isImporting = importFetcher.state === 'submitting' || importFetcher.state === 'loading';
    const isDownloadingSample = sampleFetcher.state === 'submitting';
    const isSubmitting = navigation.state === 'submitting';

    const pageCount = Math.ceil(totalReviews / reviewsPerPage);
    const hasNext = currentPage < pageCount;
    const hasPrevious = currentPage > 1;

    const handlePageChange = (newPage: number) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("page", String(newPage));
        navigate(`?${newSearchParams.toString()}`);
    };

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setCsvFile(file);
    }, []);

    const handleRemoveFile = useCallback(() => {
        setCsvFile(null);
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }, []);

    const toggleActiveToast = useCallback(() => setActiveToast((active) => !active), []);

    const handleExportCSV = useCallback(() => {
        const formData = new FormData();
        formData.append('actionType', 'export_csv');
        exportFetcher.submit(formData, { method: 'post' });
    }, [exportFetcher]);

    const handleDownloadSampleCSV = useCallback(() => {
        const formData = new FormData();
        formData.append('actionType', 'download_sample_csv');
        sampleFetcher.submit(formData, { method: 'post' });
    }, [sampleFetcher]);

    const handleImportCSV = useCallback(() => {
        if (!csvFile) {
            setToastMessage('Please select a CSV file to import');
            setToastError(true);
            setActiveToast(true);
            return;
        }
        const formData = new FormData();
        formData.append('actionType', 'import_csv');
        formData.append('csvFile', csvFile);

        importFetcher.submit(formData, {
            method: 'post',
            encType: 'multipart/form-data'
        });
    }, [csvFile, importFetcher]);

    // Handle Export Download
    useEffect(() => {
        if (exportFetcher.data?.csvData && exportFetcher.data.fileName) {
            const blob = new Blob([exportFetcher.data.csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = exportFetcher.data.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else if (exportFetcher.data?.error) {
            setToastMessage(exportFetcher.data.error);
            setToastError(true);
            setActiveToast(true);
        }
    }, [exportFetcher.data]);

    // Handle Sample Download
    useEffect(() => {
        if (sampleFetcher.data?.csvData && sampleFetcher.data.fileName) {
            const blob = new Blob([sampleFetcher.data.csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = sampleFetcher.data.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    }, [sampleFetcher.data]);

    // Handle Import Response
    useEffect(() => {
        if (importFetcher.data) {
            setToastMessage(importFetcher.data.message || importFetcher.data.error || 'Import completed.');
            setToastError(!importFetcher.data.success);
            setActiveToast(true);

            if (importFetcher.data.success) {
                setCsvFile(null);
                const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }
        }
    }, [importFetcher.data]);

    const handleTabChange = useCallback((selectedTabIndex: number) => {
        setSelectedTab(selectedTabIndex);
        setSelectedBundleId(null);
        setSelectedProductId(null);
    }, []);

    const handleSortChange = useCallback((value: string) => {
        setSortOption(value);
    }, []);

    return {
        reviews, totalReviews, averageRating, currentPage, reviewsPerPage,
        productSummaries, bundles, shopifyProducts,
        csvFile, activeToast, toastMessage, toastError,
        selectedTab, selectedBundleId, selectedProductId, sortOption,
        isSubmitting, isExporting, isImporting, isDownloadingSample, pageCount, hasNext, hasPrevious,
        handlePageChange, handleFileChange, handleRemoveFile, toggleActiveToast,
        handleExportCSV, handleDownloadSampleCSV, handleImportCSV,
        handleTabChange, handleSortChange,
        setSelectedBundleId, setSelectedProductId, setActiveToast
    };
}
