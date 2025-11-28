export interface FQHCSite {
    "BHCMIS Organization Identification Number": string;
    "BPHC Assigned Number": string;
    "Complete County Name": string;
    "Congressional District Code": string;
    "Congressional District Name": string;
    "Congressional District Number": string;
    "County Description": string;
    "County Equivalent Name": string;
    "Data Warehouse Record Create Date": string;
    "FQHC Site Medicare Billing Number": string;
    "FQHC Site NPI Number": string;
    "Geocoding Artifact Address Primary X Coordinate": string;
    "Geocoding Artifact Address Primary Y Coordinate": string;
    "Grantee Organization Type Description": string;
    "HHS Region Code": string;
    "HHS Region Name": string;
    "Health Center Location Identification Number": string;
    "Health Center Location Setting Identification Number": string;
    "Health Center Location Type Description": string;
    "Health Center Name": string;
    "Health Center Number": string;
    "Health Center Operating Calendar": string;
    "Health Center Operating Calendar Surrogate Key": string;
    "Health Center Operating Schedule Identification Number": string;
    "Health Center Operational Schedule Description": string;
    "Health Center Operator Description": string;
    "Health Center Operator Identification Number": string;
    "Health Center Organization City": string;
    "Health Center Organization State": string;
    "Health Center Organization Street Address": string;
    "Health Center Organization ZIP Code": string;
    "Health Center Service Delivery Site Location Setting Description": string;
    "Health Center Status Identification Number": string;
    "Health Center Type": string;
    "Health Center Type Description": string;
    "Health Center Type Identification Number": string;
    "Name of U.S. Senator Number One": string;
    "Name of U.S. Senator Number Two": string;
    "Operating Hours per Week": string;
    "Site Added to Scope this Date": string;
    "Site Address": string;
    "Site City": string;
    "Site Name": string;
    "Site Postal Code": string;
    "Site State Abbreviation": string;
    "Site Status Description": string;
    "Site Telephone Number": string;
    "Site Web Address": string;
    "State FIPS Code": string;
    "State FIPS and Congressional District Number Code": string;
    "State Name": string;
    "State and County Federal Information Processing Standard Code": string;
    "U.S. - Mexico Border 100 Kilometer Indicator": string;
    "U.S. - Mexico Border County Indicator": string;
    "U.S. Congressional Representative Name": string;
    "Medicare": number;
    distance: number;
}

export interface City {
    name: string;
    distance: number
    lat: number,
    lon: number
}

export type HeightUpdateFunction = (height: number, delay?: number) => void

export type MapCenter = { lat: number; lon: number } | undefined