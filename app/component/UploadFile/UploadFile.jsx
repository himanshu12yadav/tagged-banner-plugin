/**
 * @author Sprinix Team
 * @copyright Copyright (c) 2023 Sprinix Technolabs (https://www.sprinix.com).
 */

import { DropZone, LegacyCard, Thumbnail, Text } from "@shopify/polaris";
import { NoteIcon } from "@shopify/polaris-icons";
import { useCallback, useEffect, useState } from "react"

import { useActionData, useSubmit } from "@remix-run/react";


export const UploadFile = ({ f, handleFile, setTemp }) => {
    const [file, setFile] = useState(f || '');
    const handleDropZone = useCallback((acceptedFile) => {
        setFile(acceptedFile[0]);
        handleFile(acceptedFile[0]);
        setTemp(window.URL.createObjectURL(acceptedFile[0]));
    });

    const validImageTypes = ['image/gif', 'image/jpeg', 'image/png'];

    const fileUpload = !file && <DropZone.FileUpload />;
    const uploadFile = file && (
        <LegacyCard>
            <Thumbnail size="small" alt={file.name} source={validImageTypes.includes(file.type) ? window.URL.createObjectURL(file) : NoteIcon} />
            <div>
                {file.name}{''}
                <Text variant="bodySm" as="p">
                    {file.size} bytes
                </Text>
            </div>
        </LegacyCard>
    )

    return (
        <DropZone allowMultiple={false} onDrop={handleDropZone} variableHeight="10px">
            {uploadFile}
            {fileUpload}
        </DropZone>
    )

}
